import * as React from "react"
import { useState, useEffect } from "react"
import { Upload, Settings, FileText, X, Loader2, CheckCircle2, Eye, Trash2, Info, Github } from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fileAPI } from "../services/api"
import { useToast } from "@/hooks/use-toast"
import { ProcessingDialog } from "@/components/processing-dialog"


const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
}


export function SidebarRight({ ...props }) {
  const [activeTab, setActiveTab] = useState("documents")
  const [stagedFiles, setStagedFiles] = useState([])
  const [uploadedSources, setUploadedSources] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [currentBatch, setCurrentBatch] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Settings state
  const [enableReranking, setEnableReranking] = useState(true)
  const [rerankModel, setRerankModel] = useState("rerank-english-v3.0")
  const [agentMode, setAgentMode] = useState("simple")
  
  const { toast } = useToast()


  // Fetch existing files on mount
  useEffect(() => {
    fetchUserFiles()
  }, [])


  const fetchUserFiles = async () => {
    setLoading(true)
    try {
      const response = await fileAPI.getUserFiles()
      const files = response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(file.uploaded_at * 1000).toISOString(),
        status: file.status,
        stage: file.stage,
        job_stats: file.job_stats,
        isExisting: true
      }))
      setUploadedSources(files)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Failed to load files",
        description: error.response?.data?.detail || "Could not fetch uploaded files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleFileSelection = (files) => {
    if (!files || files.length === 0) return
    
    const newFiles = Array.from(files).map(file => ({
      file: file,
      name: file.name,
      size: file.size,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0
    }))
    
    setStagedFiles(prev => [...prev, ...newFiles])
  }


  const handleDrop = (e) => {
    e.preventDefault()
    handleFileSelection(e.dataTransfer.files)
  }


  const handleFileInput = (e) => {
    handleFileSelection(e.target.files)
  }


  const removeStagedFile = (fileId) => {
    setStagedFiles(prev => prev.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }


  const handleSubmitFiles = async () => {
    if (stagedFiles.length === 0) return
    
    setUploading(true)
    const files = stagedFiles.map(f => f.file)
    
    try {
      const response = await fileAPI.upload(files, (percentCompleted) => {
        const progressUpdate = {}
        stagedFiles.forEach(f => {
          progressUpdate[f.id] = percentCompleted
        })
        setUploadProgress(progressUpdate)
      })
      
      const uploadedFiles = response.data.files.map(fileRecord => ({
        id: fileRecord.id,
        name: fileRecord.filename,
        size: stagedFiles.find(f => f.name === fileRecord.filename)?.size || 0,
        taskId: response.data.task_id,
        uploadedAt: new Date().toISOString(),
        status: fileRecord.status,
        stage: fileRecord.stage
      }))
      
      setUploadedSources(prev => [...uploadedFiles, ...prev])
      setStagedFiles([])
      setUploadProgress({})
      
      setSelectedFiles(uploadedFiles[0])
      setDialogOpen(true)
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) are being processed`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.response?.data?.detail || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }


  const handleViewFile = (file) => {
    setSelectedFiles(file)
    setDialogOpen(true)
  }


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }


  return (
    <>
      <Sidebar
        collapsible="none"
        className="sticky top-0 hidden h-svh border-l lg:flex w-[350px]"
        {...props}
      >
        <SidebarHeader className="border-sidebar-border h-16 border-b">
          <NavUser user={data.user} />
        </SidebarHeader>
        
        <SidebarContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents" className="text-xs">
                  <FileText className="h-4 w-4 mr-1" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>


            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0 space-y-4">
              {/* Demo Mode Notice */}
              <div className="px-4 pt-4">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                  <Github className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    Demo Mode
                  </AlertTitle>
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    File uploads are disabled in the demo. To upload your own documents, clone the repository from GitHub and run locally.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Disabled Upload Section */}
              <SidebarGroup>
                <SidebarGroupLabel>Add Sources</SidebarGroupLabel>
                <SidebarGroupContent className="px-4 space-y-4">
                  <div className="relative pointer-events-none opacity-50 select-none">
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center bg-muted/30 cursor-not-allowed"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Drop files or click to upload</p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOCX, CSV, PPTX, MD • Max 50MB
                        </p>
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>


              {stagedFiles.length > 0 && (
                <>
                  <SidebarSeparator className="mx-0" />
                  <SidebarGroup>
                    <SidebarGroupLabel>
                      Staged Files ({stagedFiles.length})
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="px-4">
                      <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3">
                        {stagedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-muted p-2 rounded-md"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium">{file.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                                {uploading && uploadProgress[file.id] !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <Progress 
                                      value={uploadProgress[file.id]} 
                                      className="h-1 w-16"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {uploadProgress[file.id]}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {!uploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeStagedFile(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleSubmitFiles}
                        disabled={uploading || stagedFiles.length === 0}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          `Submit ${stagedFiles.length} File${stagedFiles.length > 1 ? 's' : ''}`
                        )}
                      </Button>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}


              <SidebarSeparator className="mx-0" />
              <SidebarGroup>
                <SidebarGroupLabel>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    `Uploaded Sources (${uploadedSources.length})`
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-4">
                  {uploadedSources.length === 0 && !loading ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No sources uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {uploadedSources.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-2 rounded-md border border-green-200 dark:border-green-900 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition"
                          onClick={() => handleViewFile(file)}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewFile(file)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                toast({
                                  title: "Delete not implemented",
                                  description: "This will be implemented later",
                                })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </TabsContent>


            {/* Settings Tab - DISABLED */}
            <TabsContent value="settings" className="mt-0 space-y-4">
              {/* Development Notice Banner */}
              <div className="px-4 pt-4">
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                    Settings are currently in development and will be available soon.
                  </AlertDescription>
                </Alert>
              </div>


              {/* Disabled Settings Wrapper */}
              <div className="relative pointer-events-none opacity-50 select-none">
                <SidebarGroup>
                  <SidebarGroupLabel>Reranking</SidebarGroupLabel>
                  <SidebarGroupContent className="px-4 space-y-4">
                    <div className="flex items-center justify-between cursor-not-allowed">
                      <Label htmlFor="reranking" className="text-sm font-normal">
                        Enable reranking
                      </Label>
                      <Switch
                        id="reranking"
                        checked={enableReranking}
                        disabled
                      />
                    </div>


                    {enableReranking && (
                      <div className="space-y-2">
                        <Label htmlFor="model" className="text-xs text-muted-foreground">
                          Model
                        </Label>
                        <Select value={rerankModel} disabled>
                          <SelectTrigger id="model" className="cursor-not-allowed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rerank-english-v3.0">
                              rerank-english-v3.0
                            </SelectItem>
                            <SelectItem value="rerank-multilingual-v3.0">
                              rerank-multilingual-v3.0
                            </SelectItem>
                            <SelectItem value="rerank-english-v2.0">
                              rerank-english-v2.0
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </SidebarGroupContent>
                </SidebarGroup>


                <SidebarSeparator className="mx-0" />


                <SidebarGroup>
                  <SidebarGroupLabel>Agent Mode</SidebarGroupLabel>
                  <SidebarGroupContent className="px-4">
                    <RadioGroup value={agentMode} disabled>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 rounded-lg border cursor-not-allowed">
                          <RadioGroupItem value="simple" id="simple" className="mt-1" disabled />
                          <div className="flex-1">
                            <Label htmlFor="simple" className="text-sm font-medium cursor-not-allowed">
                              Simple RAG
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Documents-only search
                            </p>
                          </div>
                        </div>


                        <div className="flex items-start space-x-3 p-3 rounded-lg border cursor-not-allowed">
                          <RadioGroupItem value="agentic" id="agentic" className="mt-1" disabled />
                          <div className="flex-1">
                            <Label htmlFor="agentic" className="text-sm font-medium cursor-not-allowed">
                              Agentic RAG
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Smart tool selection with web search
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </SidebarGroupContent>
                </SidebarGroup>


                <SidebarSeparator className="mx-0" />


                <SidebarGroup>
                  <SidebarGroupLabel>Performance Impact</SidebarGroupLabel>
                  <SidebarGroupContent className="px-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-semibold">~50</p>
                        <p className="text-xs text-muted-foreground mt-1">Total chunks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold">~2200ms</p>
                        <p className="text-xs text-muted-foreground mt-1">Latency</p>
                      </div>
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>
            </TabsContent>
          </Tabs>
        </SidebarContent>


        <SidebarFooter className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full cursor-not-allowed" 
            size="sm"
            disabled
          >
            Apply Settings
          </Button>
        </SidebarFooter>
      </Sidebar>


      <ProcessingDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        files={selectedFiles}
        batch={currentBatch}
      />
    </>
  )
}
