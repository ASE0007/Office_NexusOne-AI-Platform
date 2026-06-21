"""NexusOne AI - Accounts Views"""

import uuid
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, CustomTokenObtainPairSerializer,
    LoginHistorySerializer, ActiveSessionSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)
from .models import LoginHistory, ActiveSession, PasswordResetToken, EmailVerificationToken
from apps.notifications.tasks import send_email_task

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User Registration"""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email
        token = EmailVerificationToken.objects.create(
            user=user,
            token=str(uuid.uuid4()),
            expires_at=timezone.now() + timedelta(hours=24)
        )
        send_email_task.delay(
            'email_verification',
            user.email,
            {'token': token.token, 'user_name': user.get_full_name()}
        )

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful. Please verify your email.',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login with JWT"""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Log login history
            user = User.objects.get(email=request.data.get('email'))
            LoginHistory.objects.create(
                user=user,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                device=request.data.get('device', 'Unknown'),
            )
            user.last_login_at = timezone.now()
            user.last_login_ip = self.get_client_ip(request)
            user.save(update_fields=['last_login_at', 'last_login_ip'])
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    """Logout - Blacklist refresh token"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get/Update user profile"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change password"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'})


class ForgotPasswordView(APIView):
    """Send password reset email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            token = PasswordResetToken.objects.create(
                user=user,
                token=str(uuid.uuid4()),
                expires_at=timezone.now() + timedelta(hours=2)
            )
            send_email_task.delay(
                'password_reset',
                user.email,
                {'token': token.token, 'user_name': user.get_full_name()}
            )
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({'message': 'If this email exists, a reset link has been sent.'})


class ResetPasswordView(APIView):
    """Reset password with token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_token = PasswordResetToken.objects.get(
                token=serializer.validated_data['token'],
                is_used=False,
                expires_at__gt=timezone.now()
            )
            reset_token.user.set_password(serializer.validated_data['new_password'])
            reset_token.user.save()
            reset_token.is_used = True
            reset_token.save()
            return Response({'message': 'Password reset successfully'})
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """Verify email with token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        try:
            verification = EmailVerificationToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
            verification.user.is_email_verified = True
            verification.user.save()
            verification.is_used = True
            verification.save()
            return Response({'message': 'Email verified successfully'})
        except EmailVerificationToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


class LoginHistoryView(generics.ListAPIView):
    """Get user login history"""
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user)


class ActiveSessionsView(generics.ListAPIView):
    """Get user active sessions"""
    serializer_class = ActiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActiveSession.objects.filter(user=self.request.user, is_active=True)


class UserListView(generics.ListAPIView):
    """List users (Admin only)"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'company']
    search_fields = ['email', 'first_name', 'last_name']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return User.objects.all()
        return User.objects.filter(company=user.company)
