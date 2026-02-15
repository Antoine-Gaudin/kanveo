// src/components/sirene/SireneImporter.jsx
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Trash2, Download } from "lucide-react";

export default function SireneImporter({
  fileRef,
  handleFile,
  clearFile,
  rowCount,
  onExportCSV,
  onExportXLSX,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isValid = /\.(csv|xlsx?|xls)$/i.test(file.name);
      if (isValid) {
        // Simuler un événement input change
        const fakeEvent = { target: { files: [file] } };
        handleFile(fakeEvent);
      }
    }
  }, [handleFile]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Zone de drag-and-drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            }`}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full p-3 transition-colors ${isDragOver ? 'bg-primary/20' : 'bg-muted'}`}>
                <Upload className={`w-6 h-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier SIRENE'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou <span className="text-primary font-medium">cliquez pour parcourir</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <FileSpreadsheet className="w-3 h-3" />
                CSV, XLSX, XLS — Max 50 MB
              </p>
            </div>
          </div>

          {/* Boutons d'actions */}
          {rowCount > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportXLSX}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter XLSX
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearFile}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
