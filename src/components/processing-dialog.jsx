import * as React from "react"
import { useState, useEffect } from "react"
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Database,
  SplitSquareVertical,
  Upload as UploadIcon,
  Layers,
  FileSearch,
  Loader2,
  Search,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardSmall } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

// If unused for now you can remove these imports
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fileAPI } from "../services/api"

const PIPELINE_TABS = [
  { id: "upload", label: "Upload to S3", icon: UploadIcon },
  { id: "queued", label: "Queued", icon: Clock },
  { id: "partitioning", label: "Partitioning", icon: FileSearch },
  { id: "chunking", label: "Chunking", icon: SplitSquareVertical },
  { id: "vectorization", label: "Vectorization & Storage", icon: Database },
  { id: "view_chunks", label: "View Chunks", icon: FileText },
]


function ViewChunksSection({
  chunks,
  filteredChunks,
  selectedChunk,
  setSelectedChunk,
  chunkFilter,
  setChunkFilter,
  searchQuery,
  setSearchQuery,
  files,
}) {
  return (
    <div className="h-full min-h-0 w-full flex">
      {/* Left Pane */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Content Chunks</h3>
            <span className="text-sm text-muted-foreground">
              {filteredChunks.length} of {chunks.length} chunks
            </span>
          </div>

          <div className="flex items-center gap-2">

            <Separator orientation="vertical" className="h-6" />

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chunks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* IMPORTANT: flex-1 + min-h-0 (NOT h-full) */}
        <ScrollArea className="h-0 flex-1">
          <div className="p-4 space-y-2">
            {filteredChunks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No chunks available yet</p>
                <p className="text-sm mt-1">
                  Chunks will appear here after processing
                </p>
              </div>
            ) : (
              filteredChunks.map((chunk, idx) => (
                <Card
                  key={idx}
                  className={`cursor-pointer transition hover:bg-muted/50 ${
                    selectedChunk === idx ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedChunk(idx)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        >
                          {chunk.type || "text"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Page {chunk.page ?? " "}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {chunk.chars ?? " "} chars
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3 text-muted-foreground">
                      {chunk.content || "No content available"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator orientation="vertical" className="h-full" />

      {/* Right Pane */}
      <div className="w-[450px] shrink-0 min-h-0 flex flex-col overflow-hidden bg-muted/20">
        <div className="p-4 border-b shrink-0">
          <h3 className="font-semibold">Detail Inspector</h3>
        </div>

        <ScrollArea className="h-0 flex-1">
          {selectedChunk === null ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select a chunk to inspect details
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>

                <h4 className="font-semibold mb-2">Content</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {filteredChunks[selectedChunk]?.content ||
                    "No content available"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Metadata</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page:</span>
                    <span className="font-medium">
                      {filteredChunks[selectedChunk]?.page ?? " "}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Characters:</span>
                    <span className="font-medium">
                      {filteredChunks[selectedChunk]?.chars ?? "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span
                      className="font-medium truncate ml-2"
                      title={filteredChunks[selectedChunk]?.source}
                    >
                      {filteredChunks[selectedChunk]?.source ||
                        files?.[0]?.name ||
                        " "}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export function ProcessingDialog({ open, onOpenChange, files }) {
  const [activeTab, setActiveTab] = useState("upload")
  const [taskStatus, setTaskStatus] = useState(null)
  const [fileMetadata, setFileMetadata] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingChunk, setLoadingChunk] = useState(false)
  
  // Chunks state (restored)
  const [chunks, setChunks] = useState([])
  const [selectedChunk, setSelectedChunk] = useState(null)
  const [chunkFilter, setChunkFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  const { toast } = useToast()

  // Determine if this is a new upload with active task or completed file
  const isActiveTask = files?.taskId && files?.status === 'processing'
  const isCompleted = files?.status === 'completed' || files?.isExisting

  useEffect(() => {
    if (!open || !files) return

    setActiveTab('upload')
    setTaskStatus(null)
    setFileMetadata(null)
    setChunks([]) // Reset chunks

    if (isActiveTask) {
      // Poll for active task
      const pollInterval = setInterval(async () => {
        try {
          const response = await fileAPI.getTaskStatus(files.taskId)
          setTaskStatus(response.data)
          
          if (response.data.state === 'PROGRESS') {
            const currentStage = response.data.current_stage
            
          } else if (response.data.state === 'SUCCESS') {
            clearInterval(pollInterval)
            
            // Fetch final metadata from database
            fetchFileMetadata()
          } else if (response.data.state === 'FAILURE') {
            clearInterval(pollInterval)
            toast({
              title: "Processing failed",
              description: response.data.status,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Error polling task status:', error)
          clearInterval(pollInterval)
        }
      }, 2000)

      return () => clearInterval(pollInterval)
    } else if (isCompleted) {
      // Fetch metadata for completed file
      fetchFileMetadata()
    }
  }, [open, files])

  // Load placeholder chunks when view_chunks tab is accessed
useEffect(() => {
  if (activeTab === 'view_chunks' && chunks.length === 0 && files?.id) {
    fetchChunks()
  }
}, [activeTab])

const fetchChunks = async () => {
  if (!files?.id) {
    console.warn('No file ID available')
    return
  }
  
  setLoadingChunk(true)
  try {
    const response = await fileAPI.getFileChunks(files.id)
    setChunks(response.data.chunks)
    
    if (response.data.chunks.length === 0) {
      toast({
        title: "No chunks found",
        description: "This file has no processed chunks yet",
        variant: "default",
      })
    }
  } catch (error) {
    console.error('Error fetching chunks:', error)
    toast({
      title: "Failed to load chunks",
      description: error.response?.data?.detail || "Could not retrieve document chunks",
      variant: "destructive",
    })
    
  } finally{
    setLoadingChunk(false)
  }
}

  const fetchFileMetadata = async () => {
    if (!files?.name) return
    
    setLoading(true)
    try {
      const response = await fileAPI.getFileMetadata(files.name)
      setFileMetadata(response.data)
    } catch (error) {
      console.error('Error fetching file metadata:', error)
      toast({
        title: "Failed to load file details",
        description: "Could not retrieve processing information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStageData = () => {
    if (isActiveTask && taskStatus?.files_stats) {
      // ✅ Extract THIS file's stats from task metadata
      return taskStatus.files_stats[files.name] || {}
    } else if (fileMetadata?.job_stats) {
      // For completed files, use DB data
      return fileMetadata.job_stats
    }
    return {}
  }

  const getStageStatus = (stageId) => {
    if (isCompleted) return 'completed'
    
    if (!taskStatus) return 'pending'
    
    const stageOrder = ['upload', 'queued', 'partitioning', 'chunking', 'vectorization']
    const currentIndex = stageOrder.indexOf(taskStatus.current_stage)
    const targetIndex = stageOrder.indexOf(stageId)
    
    if (taskStatus.state === 'SUCCESS') return 'completed'
    if (targetIndex < currentIndex) return 'completed'
    if (targetIndex === currentIndex) return 'processing'
    return 'pending'
  }

  if (!files) return null

  const stagesData = getStageData()

  // Filter chunks based on type and search query
  const filteredChunks = chunks.filter(chunk => {
    if (chunkFilter !== 'all' && chunk.type !== chunkFilter) return false
    if (searchQuery && !chunk.content?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (loadingChunk) {
      return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    switch (activeTab) {
      case "upload":
        return (
          <div className="p-15 min-h-[70vh]">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Upload to S3</h3>
                <p className="text-muted-foreground">
                  File uploaded to secure cloud storage
                </p>
              </div>
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardContent className="pt-1">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Step completed successfully</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "queued":
        return (
          <div className="p-12 min-h-[70vh]">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                {getStageStatus('queued') === 'processing' ? (
                  <Loader2 className="h-12 w-12 text-green-600 dark:text-green-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Queued</h3>
                <p className="text-muted-foreground">File queued for processing</p>
              </div>
              {getStageStatus('queued') === 'completed' && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardContent className="pt-1">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Step completed successfully</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case "partitioning":
        return (
          <div className="p-12 min-h-[70vh]">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Partitioning</h3>
                <p className="text-muted-foreground">
                  Processing and extracting text, images, and tables
                </p>
              </div>

              {/* Only show if partitioning data exists */}
              {stagesData.partitioning ? (
                <Card className="border-2 max-h-[50vh]">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold">Elements Discovered</h4>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 ">
                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4 " >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Text sections</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.text_sections || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>

                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tables</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.tables || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>

                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Images</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.images_total || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>
                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Images With Description</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.images_with_desc || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>

                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Other</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.other || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>


                      <CardSmall className="bg-muted/50 max-h-[70px]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Page Count</span>
                            <span className="text-2xl font-bold">
                              {stagesData.partitioning.page_count || 0}
                            </span>
                          </div>
                        </CardContent>
                      </CardSmall>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Show loading/processing state when no data yet
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Processing document...</span>
                </div>
              )}

              {getStageStatus('partitioning') === 'completed' && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Step completed successfully</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )


      case "chunking":
        return (
          <div className="p-12 min-h-[70vh]">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Creating Semantic Chunks</h3>
              </div>

              {/* Only show if chunking data exists */}
              {stagesData.chunking ? (
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <SplitSquareVertical className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-700 dark:text-green-400">
                        Chunking Results
                      </h4>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-8">
                          <div className="text-center">
                            <div className="text-4xl font-bold">
                              {stagesData.chunking.atomic_elements || '0'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              elements
                            </div>
                          </div>
                          <div className="text-2xl text-muted-foreground">→</div>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                              {stagesData.chunking.chunks_created || 0}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              chunks created
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Average chunk size</span>
                      <span className="text-sm font-bold">
                        {stagesData.chunking.avg_chunk_size || '0'} characters
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Show loading/processing state when no data yet
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Creating chunks...</span>
                </div>
              )}

              {getStageStatus('chunking') === 'completed' && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Step completed successfully</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )


      case "vectorization":
        return (
          <div className="p-12 min-h-[70vh]">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">
                  Vectorization & Storage
                </h3>
                <p className="text-muted-foreground">
                  Embeddings generated and stored in vector database
                </p>
              </div>
              
              {getStageStatus('vectorization') === 'completed' && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Step completed successfully</span>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        )

      case "view_chunks":
        // Return the full ViewChunksSection component
        return (
          <ViewChunksSection
            chunks={chunks}
            filteredChunks={filteredChunks}
            selectedChunk={selectedChunk}
            setSelectedChunk={setSelectedChunk}
            chunkFilter={chunkFilter}
            setChunkFilter={setChunkFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            files={files}
          />
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] h-[85vh] max-h-[95vh] overflow-hidden !p-0 !gap-0 !flex !flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {files?.name || "Processing Pipeline"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Tabs Navigation - REMOVED FILTER */}
          <div className="border-b px-4 bg-muted/30 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto">
              {PIPELINE_TABS.map((tab) => {
                const status = getStageStatus(tab.id)
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition
                      ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }
                      ${
                        status === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {status === 'processing' && (
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'view_chunks' ? (
              // Render ViewChunksSection without ScrollArea wrapper
              renderTabContent()
            ) : (
              // Wrap other tabs in ScrollArea
              <ScrollArea className="h-full">
                {renderTabContent()}
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
