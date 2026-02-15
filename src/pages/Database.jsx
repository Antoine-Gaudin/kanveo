// src/pages/Database.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import useDatabase from "../hooks/useDatabase";
import ColumnConfig from "../components/database/ColumnConfig";
import FileUploader from "../components/database/FileUploader";
import ColumnMapper from "../components/database/ColumnMapper";
import DataTable from "../components/database/DataTable";
import RowDetailsModal from "../components/database/RowDetailsModal";
import MultiplePipelineSelector from "../components/sirene/MultiplePipelineSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseIcon, Settings2, Upload, Table2, CheckCircle2 } from "lucide-react";

export default function Database() {
  const { user } = useAuth();
  const db = useDatabase(user?.id);

  const [selectedRow, setSelectedRow] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [pipelineProspects, setPipelineProspects] = useState([]);
  const [activeTab, setActiveTab] = useState("data");

  // Open row details
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setShowDetails(true);
  };

  // Add to pipeline - rows now have .data with fields inside
  const handleAddToPipeline = (rows) => {
    const prospects = rows.map(r => ({
      company_name: r.data?.company || r.data?.name || "Sans nom",
      contact_name: r.data?.name || "",
      email: r.data?.email || "",
      phone: r.data?.phone || "",
      address: r.data?.address || "",
      notes: r.notes || r.data?.notes || "",
      source: "import_database",
      __dbId: r.id,
    }));
    setPipelineProspects(prospects);
    setShowPipelineModal(true);
  };

  // After pipeline success, mark rows
  const handlePipelineSuccess = () => {
    const rowIds = pipelineProspects
      .map(p => p.__dbId)
      .filter(Boolean);
    if (rowIds.length > 0) {
      db.markAsPipelined(rowIds);
    }
    setShowPipelineModal(false);
    setPipelineProspects([]);
  };

  // Default tab: config if no column config saved yet
  useEffect(() => {
    if (db.columnConfig && db.columnConfig.length === 0) {
      setActiveTab("config");
    }
  }, [db.columnConfig]);

  return (
    <div className="space-y-6">
      {/* Migration toast */}
      {db.migrationMessage && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {db.migrationMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <DatabaseIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ma Base</h1>
              <p className="text-muted-foreground text-sm">
                Importez vos fichiers CSV ou Excel et ajoutez vos contacts au pipeline
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {db.totalCount > 0 && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Table2 className="w-3.5 h-3.5" />
              {db.totalCount} ligne{db.totalCount > 1 ? "s" : ""}
            </Badge>
          )}
          {db.imports.length > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Upload className="w-3.5 h-3.5" />
              {db.imports.length} fichier{db.imports.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="data" className="gap-2">
            <Table2 className="w-4 h-4" />
            Donnees
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Tab Configuration */}
        <TabsContent value="config" className="space-y-6">
          <ColumnConfig
            columnConfig={db.columnConfig}
            onSave={db.saveColumnConfig}
            defaultColumns={db.DEFAULT_COLUMNS}
          />
        </TabsContent>

        {/* Tab Donnees */}
        <TabsContent value="data" className="space-y-6">
          {/* Uploader */}
          <FileUploader
            fileRef={db.fileRef}
            onFileChange={db.handleFile}
            isImporting={db.isImporting}
            importProgress={db.importProgress}
            totalCount={db.totalCount}
            fileCount={db.imports.length}
            onExportCSV={db.exportCSV}
            onExportXLSX={db.exportXLSX}
            onClearAll={db.clearAll}
          />

          {/* Import error */}
          {db.importError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4 text-center text-destructive text-sm">
                {db.importError}
              </CardContent>
            </Card>
          )}

          {/* Mapping modal */}
          <ColumnMapper
            isOpen={!!db.pendingData}
            headers={db.pendingHeaders}
            pendingData={db.pendingData}
            mapping={db.pendingMapping}
            fileName={db.pendingFileName}
            duplicateWarnings={db.duplicateWarnings}
            getMappingConfidence={db.getMappingConfidence}
            onUpdateMapping={db.updateMapping}
            onConfirm={db.confirmImport}
            onCancel={db.cancelImport}
          />

          {/* Table */}
          <DataTable
            rows={db.rows}
            imports={db.imports}
            enabledColumns={db.enabledColumns}
            searchTerm={db.searchTerm}
            onSearchChange={db.setSearchTerm}
            activeImportFilter={db.activeImportFilter}
            onImportFilterChange={db.setActiveImportFilter}
            onDeleteRow={db.deleteRow}
            onRowClick={handleRowClick}
            onAddToPipeline={handleAddToPipeline}
            page={db.page}
            onPageChange={db.setPage}
            pageSize={db.pageSize}
            totalCount={db.totalCount}
            totalPages={db.totalPages}
            loading={db.loading}
          />
        </TabsContent>
      </Tabs>

      {/* Row details modal */}
      <RowDetailsModal
        row={selectedRow}
        open={showDetails}
        onOpenChange={setShowDetails}
        onUpdateNote={db.updateRowNote}
        onAddToPipeline={handleAddToPipeline}
        enabledColumns={db.enabledColumns}
        imports={db.imports}
      />

      {/* Pipeline modal */}
      {showPipelineModal && (
        <MultiplePipelineSelector
          prospects={pipelineProspects}
          onClose={() => {
            setShowPipelineModal(false);
            setPipelineProspects([]);
          }}
          onSuccess={handlePipelineSuccess}
        />
      )}
    </div>
  );
}
