'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsAPI } from '@/services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useDropzone } from 'react-dropzone';
import {
  FileText, FolderOpen, Upload, Search, Plus, Download, Trash2,
  File, FileImage, FileCode, FileType, Eye, Tag, Lock, Globe
} from 'lucide-react';

function getFileIcon(fileType: string) {
  if (fileType.includes('image')) return FileImage;
  if (fileType.includes('pdf')) return FileType;
  if (fileType.includes('code') || fileType.includes('text')) return FileCode;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: foldersData } = useQuery({
    queryKey: ['document-folders'],
    queryFn: documentsAPI.getFolders,
  });

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['documents', search, selectedFolder],
    queryFn: () => documentsAPI.getAll({ search, ...(selectedFolder ? { folder: selectedFolder } : {}) }),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentsAPI.upload(formData),
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadOpen(false);
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsAPI.delete(id),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => documentsAPI.createFolder({ name }),
    onSuccess: () => {
      toast.success('Folder created');
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('file', file);
      formData.append('title', file.name);
      if (selectedFolder) formData.append('folder', selectedFolder);
    });
    uploadMutation.mutate(formData);
  }, [selectedFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const folders = foldersData?.data?.results || foldersData?.data || [];
  const docs = docsData?.data?.results || docsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Store and manage all company files securely</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const name = prompt('Folder name:'); if (name) createFolderMutation.mutate(name); }} className="btn-secondary">
            <FolderOpen className="w-4 h-4" /> New Folder
          </button>
          <button onClick={() => setUploadOpen(!uploadOpen)} className="btn-primary">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      {uploadOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div {...getRootProps()} className={cn('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all', isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-dark-200 dark:border-dark-600 hover:border-primary-400')}>
            <input {...getInputProps()} />
            <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-primary-500' : 'text-dark-300')} />
            <p className="text-sm font-medium text-dark-600 dark:text-dark-300">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-dark-400 mt-1">Supports PDF, images, documents, and more</p>
            {uploadMutation.isPending && <p className="text-sm text-primary-500 mt-2">Uploading...</p>}
          </div>
        </motion.div>
      )}

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          <button onClick={() => setSelectedFolder(null)} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all', !selectedFolder ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700')}>
            <FolderOpen className="w-4 h-4" /> All Documents
          </button>
          {folders.map((folder: any) => (
            <button key={folder.id} onClick={() => setSelectedFolder(folder.id)} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all', selectedFolder === folder.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700')}>
              <FolderOpen className="w-4 h-4 text-yellow-500" /> <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-400">No documents found. Upload your first file.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {docs.map((doc: any) => {
                const FileIcon = getFileIcon(doc.file_type || '');
                return (
                  <motion.div key={doc.id} className="card-hover p-4 group" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <FileIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => window.open(doc.file, '_blank')} className="p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(doc.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium text-dark-900 dark:text-white text-sm line-clamp-2 mb-1">{doc.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-dark-400">{formatBytes(doc.file_size || 0)}</span>
                      {doc.is_public ? <Globe className="w-3.5 h-3.5 text-green-500" /> : <Lock className="w-3.5 h-3.5 text-dark-400" />}
                    </div>
                    <p className="text-xs text-dark-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
