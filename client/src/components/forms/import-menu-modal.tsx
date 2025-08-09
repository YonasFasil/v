import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, Download, FileText, Package, Utensils, 
  AlertTriangle, CheckCircle, X, Eye, FileSpreadsheet 
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

export function ImportMenuModal({ open, onOpenChange, type }: ImportMenuModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportItem[]>([]);
  const [previewData, setPreviewData] = useState<ImportItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      setUploadProgress(50);

      // Validate required headers
      const requiredHeaders = type === "packages" 
        ? ['name', 'description', 'category', 'price', 'pricingModel']
        : ['name', 'description', 'category', 'price', 'pricingModel'];

      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      setUploadProgress(70);

      const items: ImportItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const item: ImportItem = {
          name: "",
          description: "",
          category: "",
          price: 0,
          pricingModel: "fixed",
          row: i + 1,
          status: "valid",
          errors: [],
          warnings: []
        };

        // Parse each column
        headers.forEach((header, index) => {
          const value = values[index] || "";
          const headerLower = header.toLowerCase();

          switch (headerLower) {
            case 'name':
              item.name = value;
              if (!value) item.errors?.push("Name is required");
              break;
            case 'description':
              item.description = value;
              break;
            case 'category':
              item.category = value;
              if (!value) item.errors?.push("Category is required");
              break;
            case 'price':
              const price = parseFloat(value);
              if (isNaN(price) || price < 0) {
                item.errors?.push("Price must be a valid positive number");
              } else {
                item.price = price;
              }
              break;
            case 'pricingmodel':
              if (['fixed', 'per_person'].includes(value.toLowerCase())) {
                item.pricingModel = value.toLowerCase();
              } else {
                item.errors?.push("Pricing model must be 'fixed' or 'per_person'");
              }
              break;
            case 'includedservices':
              if (type === "packages" && value) {
                item.includedServices = value.split(';').map(s => s.trim()).filter(s => s);
              }
              break;
          }
        });

        // Set status based on errors and warnings
        if (item.errors && item.errors.length > 0) {
          item.status = "error";
        } else if (item.warnings && item.warnings.length > 0) {
          item.status = "warning";
        }

        items.push(item);
      }

      setParsedData(items);
      setPreviewData(items.slice(0, 10)); // Show first 10 for preview
      setUploadProgress(100);
      setActiveTab("preview");
      
      toast({
        title: "File Parsed Successfully",
        description: `Found ${items.length} items. Review the preview before importing.`
      });

    } catch (error) {
      toast({
        title: "Parsing Failed",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
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