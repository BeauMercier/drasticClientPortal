'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface AdminProjectFile {
  id: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
  uploader: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function ProjectFileList({
  projectId,
  projectType,
}: {
  projectId: string;
  projectType: string;
}) {
  const [files, setFiles] = useState<AdminProjectFile[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/project-files/${projectType}/${projectId}`
        );
        if (res.ok) {
          const data = await res.json();
          setFiles(data as AdminProjectFile[]);
        } else {
          const errorText = await res.text();
          console.error('Failed to fetch files:', res.status, errorText);
          setFiles([]);
        }
      } catch (error) {
        console.error('Exception fetching files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    if (projectId && projectType) {
        fetchFiles();
    } else {
        setLoading(false);
        setFiles([]);
    }
  }, [projectId, projectType]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No files have been uploaded for this project yet.</p>;
  }

  return (
    <ul className="divide-y border rounded-md bg-card">
      {files.map((f) => (
        <li key={f.id} className="p-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={f.storage_path.split('/').pop() || ''}>
                {f.storage_path.split('/').pop() || 'Untitled File'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Uploaded by: {f.uploader?.full_name || f.uploader?.email || 'Unknown User'} • {' '}
                {formatDistance(new Date(f.created_at), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            asChild
            title={`Download ${f.storage_path.split('/').pop() || ''}`}
            className="flex-shrink-0"
          >
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-files/${f.storage_path}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
} 