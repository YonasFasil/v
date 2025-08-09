import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, Download, FileText, Package, Utensils, 
  AlertTriangle, CheckCircle, X, Eye, FileSpreadsheet, ArrowRight 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ImportMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "packages" | "services";
}

interface ImportItem {
  name: string;
  description: string;
  category: string;
  price: number;
  pricingModel: string;
  includedServices?: string[];
  row: number;
  status?: "valid" | "error" | "warning";
  errors?: string[];
  warnings?: string[];
}

interface ColumnMapping {
  [csvColumn: string]: string; // Maps CSV column to our required field
}

interface ParsedCSV {
  headers: string[];
  rows: any[][];
}

const SAMPLE_CSV_PACKAGES = `name,description,category,price,pricingModel,includedServices
Wedding Premium Package,"Full wedding service with catering and decor",wedding,5000,fixed,"Catering Service,Floral Arrangements,Photography"
Corporate Meeting Package,"Professional meeting setup with AV equipment",corporate,1500,fixed,"AV Equipment,Catering Service"
Birthday Party Package,"Fun birthday party setup with entertainment",social,800,per_person,"Entertainment,Decorations"`;

const SAMPLE_CSV_SERVICES = `name,description,category,price,pricingModel
Catering Service,"Full service catering with appetizers and main course",catering,50,per_person,per_person
Floral Arrangements,"Professional flower arrangements and centerpieces",decor,300,fixed,fixed
Photography,"Professional event photography with edited photos",photography,800,fixed,fixed
AV Equipment,"Sound system and projector rental",equipment,200,fixed,fixed
Entertainment,"Live DJ and music entertainment",entertainment,400,fixed,fixed
Decorations,"Custom decorations and table settings",decor,150,fixed,fixed`;

// Required fields for each import type
const REQUIRED_FIELDS = {
  packages: [
    { key: "name", label: "Package Name", required: true, description: "The name of the package" },
    { key: "description", label: "Description", required: false, description: "Package description" },
    { key: "category", label: "Category", required: true, description: "Package category" },
    { key: "price", label: "Price", required: true, description: "Package price (number)" },
    { key: "pricingModel", label: "Pricing Model", required: true, description: "fixed or per_person" },
    { key: "includedServices", label: "Included Services", required: false, description: "Comma-separated service names" }
  ],
  services: [
    { key: "name", label: "Service Name", required: true, description: "The name of the service" },
    { key: "description", label: "Description", required: false, description: "Service description" },
    { key: "category", label: "Category", required: true, description: "Service category" },
    { key: "price", label: "Price", required: true, description: "Service price (number)" },
    { key: "pricingModel", label: "Pricing Model", required: true, description: "fixed, per_person, or per_hour" }
  ]
};

export function ImportMenuModal({ open, onOpenChange, type }: ImportMenuModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportItem[]>([]);
  const [previewData, setPreviewData] = useState<ImportItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rawCSVData, setRawCSVData] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: ImportItem[]) => {
      const endpoint = type === "packages" ? "/api/packages/import" : "/api/services/import";
      const response = await apiRequest("POST", endpoint, { items: data });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.imported} ${type}. ${result.errors || 0} errors, ${result.warnings || 0} warnings.`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${type}`] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import items. Please check your data and try again.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setPreviewData([]);
    setUploadProgress(0);
    setIsProcessing(false);
    setActiveTab("upload");
    setRawCSVData(null);
    setColumnMapping({});
    setShowColumnMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Intelligent column mapping based on similarity
  const suggestColumnMapping = (csvHeaders: string[], requiredFields: any[]) => {
    const mapping: ColumnMapping = {};
    
    csvHeaders.forEach(csvHeader => {
      const normalizedCSVHeader = csvHeader.toLowerCase().trim();
      
      // Find the best match among required fields
      let bestMatch = '';
      let bestScore = 0;
      
      requiredFields.forEach(field => {
        const normalizedFieldKey = field.key.toLowerCase();
        const normalizedFieldLabel = field.label.toLowerCase();
        
        // Exact match
        if (normalizedCSVHeader === normalizedFieldKey || normalizedCSVHeader === normalizedFieldLabel) {
          bestMatch = field.key;
          bestScore = 1;
          return;
        }
        
        // Partial match or common variations
        const variations = {
          name: ['title', 'item_name', 'product_name', 'service_name', 'package_name'],
          description: ['desc', 'details', 'info', 'summary'],
          category: ['cat', 'type', 'group', 'classification'],
          price: ['cost', 'amount', 'rate', 'fee'],
          pricingModel: ['pricing_model', 'price_type', 'billing_type', 'rate_type', 'model']
        };
        
        if (variations[field.key as keyof typeof variations]) {
          const fieldVariations = variations[field.key as keyof typeof variations];
          if (fieldVariations.some(variation => normalizedCSVHeader.includes(variation))) {
            if (bestScore < 0.8) {
              bestMatch = field.key;
              bestScore = 0.8;
            }
          }
        }
        
        // Fuzzy matching - contains check
        if (normalizedCSVHeader.includes(normalizedFieldKey) || normalizedFieldKey.includes(normalizedCSVHeader)) {
          if (bestScore < 0.6) {
            bestMatch = field.key;
            bestScore = 0.6;
          }
        }
      });
      
      if (bestMatch && bestScore > 0.5) {
        mapping[csvHeader] = bestMatch;
      }
    });
    
    return mapping;
  };

  // Parse CSV with intelligent column detection
  const parseCSVWithMapping = (csvData: ParsedCSV, mapping: ColumnMapping) => {
    const requiredFields = REQUIRED_FIELDS[type];
    const items: ImportItem[] = [];
    
    csvData.rows.forEach((row, index) => {
      const item: any = { row: index + 2 }; // +2 because of header row and 1-based indexing
      
      // Map CSV columns to required fields
      csvData.headers.forEach((header, headerIndex) => {
        const mappedField = mapping[header];
        if (mappedField && row[headerIndex]) {
          let value = row[headerIndex].toString().trim();
          
          // Type conversion based on field
          if (mappedField === 'price') {
            const numValue = parseFloat(value.replace(/[$,]/g, ''));
            item[mappedField] = isNaN(numValue) ? 0 : numValue;
          } else if (mappedField === 'includedServices') {
            item[mappedField] = value.split(',').map(s => s.trim()).filter(s => s);
          } else {
            item[mappedField] = value;
          }
        }
      });
      
      // Set defaults for missing fields
      const defaults = {
        name: '',
        description: '',
        category: '',
        price: 0,
        pricingModel: 'fixed',
        includedServices: []
      };
      
      Object.keys(defaults).forEach(key => {
        if (!(key in item)) {
          item[key] = defaults[key as keyof typeof defaults];
        }
      });
      
      // Validate required fields
      const errors: string[] = [];
      const warnings: string[] = [];
      
      requiredFields.forEach(field => {
        if (field.required && (!item[field.key] || item[field.key] === '')) {
          errors.push(`${field.label} is required`);
        }
      });
      
      if (item.pricingModel && !['fixed', 'per_person', 'per_hour'].includes(item.pricingModel)) {
        warnings.push('Pricing model should be: fixed, per_person, or per_hour');
      }
      
      item.status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
      item.errors = errors;
      item.warnings = warnings;
      
      items.push(item as ImportItem);
    });
    
    return items;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    
    if (!validTypes.includes(selectedFile.type) && !['csv', 'xls', 'xlsx'].includes(fileExtension || '')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV or Excel file (.csv, .xls, .xlsx)",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      const text = await file.text();
      setUploadProgress(30);
      
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error("File must contain at least a header row and one data row");
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(v => v.trim().replace(/"/g, ''))
      );

      const csvData: ParsedCSV = { headers, rows };
      setRawCSVData(csvData);
      setUploadProgress(50);

      // Try intelligent column mapping
      const requiredFields = REQUIRED_FIELDS[type];
      const suggestedMapping = suggestColumnMapping(headers, requiredFields);
      
      // Check if we need manual column mapping
      const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);
      const mappedRequiredFields = Object.values(suggestedMapping).filter(field => 
        requiredFieldKeys.includes(field)
      );
      
      if (mappedRequiredFields.length < requiredFieldKeys.length) {
        // Need manual column mapping
        setColumnMapping(suggestedMapping);
        setShowColumnMapping(true);
        setUploadProgress(100);
        setIsProcessing(false);
        setActiveTab("mapping");
        return;
      }

      // Auto-mapping successful, proceed with parsing
      setColumnMapping(suggestedMapping);
      processWithMapping(csvData, suggestedMapping);

    } catch (error: any) {
      toast({
        title: "File Processing Error",
        description: error.message || "Failed to process the file. Please check the format and try again.",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const processWithMapping = (csvData: ParsedCSV, mapping: ColumnMapping) => {
    setUploadProgress(70);
    const items = parseCSVWithMapping(csvData, mapping);
    setParsedData(items);
    setPreviewData(items.slice(0, 10));
    setUploadProgress(100);
    setIsProcessing(false);
    setActiveTab("preview");
  };

  const handleColumnMappingUpdate = (csvColumn: string, targetField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: targetField
    }));
  };

  const handleMappingComplete = () => {
    if (!rawCSVData) return;
    
    // Validate that all required fields are mapped
    const requiredFields = REQUIRED_FIELDS[type].filter(f => f.required);
    const mappedFields = Object.values(columnMapping);
    const missingRequiredFields = requiredFields.filter(field => 
      !mappedFields.includes(field.key)
    );

    if (missingRequiredFields.length > 0) {
      toast({
        title: "Incomplete Mapping",
        description: `Please map the following required fields: ${missingRequiredFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    processWithMapping(rawCSVData, columnMapping);
  };

  const downloadTemplate = () => {
    const csvContent = type === "packages" ? SAMPLE_CSV_PACKAGES : SAMPLE_CSV_SERVICES;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error": return <X className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid": return "bg-green-50 border-green-200";
      case "warning": return "bg-yellow-50 border-yellow-200";
      case "error": return "bg-red-50 border-red-200";
      default: return "";
    }
  };

  const validItems = parsedData.filter(item => item.status === "valid" || item.status === "warning");
  const errorItems = parsedData.filter(item => item.status === "error");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "packages" ? <Package className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
            Import {type === "packages" ? "Packages" : "Services"} Menu
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!showColumnMapping}>Column Mapping</TabsTrigger>
            <TabsTrigger value="preview" disabled={parsedData.length === 0}>Preview Data</TabsTrigger>
            <TabsTrigger value="template">Download Template</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-4">
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  Upload a CSV or Excel file containing your {type} menu. Make sure your file includes columns for: 
                  name, description, category, price, and pricingModel.
                  {type === "packages" && " For packages, you can also include includedServices separated by semicolons."}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to select a CSV or Excel file, or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: .csv, .xls, .xlsx
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {file && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setParsedData([]);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing file...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            {rawCSVData && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Map your CSV columns to the required fields. Auto-suggestions are provided based on column names.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Column Mapping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      {rawCSVData.headers.map((csvColumn, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{csvColumn}</div>
                            <div className="text-xs text-gray-500">
                              Sample: {rawCSVData.rows[0]?.[index] || 'N/A'}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <Select
                              value={columnMapping[csvColumn] || ""}
                              onValueChange={(value) => handleColumnMappingUpdate(csvColumn, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select target field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Don't import</SelectItem>
                                {REQUIRED_FIELDS[type].map(field => (
                                  <SelectItem key={field.key} value={field.key}>
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {REQUIRED_FIELDS[type].find(f => f.key === columnMapping[csvColumn])?.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {REQUIRED_FIELDS[type].find(f => f.key === columnMapping[csvColumn])?.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Required fields: {REQUIRED_FIELDS[type].filter(f => f.required).map(f => f.label).join(', ')}
                      </div>
                      <Button onClick={handleMappingComplete}>
                        Continue to Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{validItems.length}</div>
                      <div className="text-sm text-gray-600">Valid Items</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{errorItems.length}</div>
                      <div className="text-sm text-gray-600">Items with Errors</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.length}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Data Preview
                      {previewData.length < parsedData.length && (
                        <Badge variant="secondary">
                          Showing {previewData.length} of {parsedData.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {previewData.map((item, index) => (
                        <div key={index} className={`p-4 border rounded-lg ${getStatusColor(item.status || "valid")}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(item.status || "valid")}
                                <h4 className="font-medium">{item.name}</h4>
                                <Badge variant="outline">{item.category}</Badge>
                                <Badge variant={item.pricingModel === "fixed" ? "default" : "secondary"}>
                                  {item.pricingModel === "fixed" ? `$${item.price}` : `$${item.price}/person`}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              {item.includedServices && item.includedServices.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Includes: {item.includedServices.join(", ")}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">Row {item.row}</div>
                          </div>
                          
                          {item.errors && item.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.errors.map((error, i) => (
                                <div key={i} className="text-xs text-red-600 flex items-center gap-1">
                                  <X className="w-3 h-3" />
                                  {error}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {item.warnings && item.warnings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.warnings.map((warning, i) => (
                                <div key={i} className="text-xs text-yellow-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {warning}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveTab("upload")}
                    variant="outline"
                    className="flex-1"
                  >
                    Upload Different File
                  </Button>
                  <Button
                    onClick={() => importMutation.mutate(validItems)}
                    disabled={validItems.length === 0 || importMutation.isPending}
                    className="flex-1"
                  >
                    {importMutation.isPending ? "Importing..." : `Import ${validItems.length} Valid Items`}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Download a CSV template with sample data to help you format your {type} correctly.
                  You can edit this file with Excel, Google Sheets, or any CSV editor.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Required Columns:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• <strong>name:</strong> The name of the {type === "packages" ? "package" : "service"}</li>
                    <li>• <strong>description:</strong> A detailed description</li>
                    <li>• <strong>category:</strong> Category (e.g., {type === "packages" ? "wedding, corporate, social" : "catering, entertainment, decor, photography"})</li>
                    <li>• <strong>price:</strong> Price as a number (e.g., 100.50)</li>
                    <li>• <strong>pricingModel:</strong> Either "fixed" or "per_person"</li>
                    {type === "packages" && (
                      <li>• <strong>includedServices:</strong> (Optional) Service names separated by semicolons</li>
                    )}
                  </ul>
                </div>

                <Button onClick={downloadTemplate} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download {type.charAt(0).toUpperCase() + type.slice(1)} Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}