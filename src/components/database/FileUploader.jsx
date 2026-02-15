// src/components/database/FileUploader.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Trash2, Download, Loader2 } from "lucide-react";

export default function FileUploader({
  fileRef,
  onFileChange,
  isImporting,
  importProgress,
  totalCount,
  fileCount,
  onExportCSV,
  onExportXLSX,
  onClearAll,
}) {
  const progressPercent = importProgress
    ? Math.round((importProgress.current / importProgress.total) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Import zone */}
          <div className="flex-1 w-full">
            <Label htmlFor="db-file" className="text-sm font-medium mb-2 block">
              Importer un fichier
            </Label>
            <div className="relative">
              <Input
                ref={fileRef}
                id="db-file"
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={(e) => {
                  onFileChange(e);
                }}
                disabled={isImporting}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            {/* Progress bar during import */}
            {importProgress && (
              <div className="mt-3 space-y-1.5">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Insertion en base... {importProgress.current}/{importProgress.total} lignes ({progressPercent}%)
                </p>
              </div>
            )}

            {!importProgress && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                {isImporting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Lecture du fichier...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3 h-3" />
                    Formats acceptes : CSV, XLSX, XLS
                  </>
                )}
              </p>
            )}
          </div>

          {/* Stats + Actions */}
          {totalCount > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-sm">
                  {totalCount} ligne{totalCount > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {fileCount} fichier{fileCount > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExportCSV}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExportXLSX}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  XLSX
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClearAll}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Tout effacer
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
