import FileList from '@/components/FileList';

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Files</h1>
      </div>
      
      <FileList />
    </div>
  );
} 