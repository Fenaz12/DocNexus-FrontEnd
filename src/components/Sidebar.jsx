import * as React from "react"
import { useState, useEffect } from "react"
import { CheckCircle2, Loader2, XCircle, Clock, Eye, FileText, Database, SplitSquareVertical, Upload as UploadIcon, Layers, FileSearch, Search } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { fileAPI } from "../services/api"
import { useToast } from "@/hooks/use-toast"


const PIPELINE_TABS = [
  { id: 'upload', label: 'Upload to S3', icon: UploadIcon },
  { id: 'queued', label: 'Queued', icon: Clock },
  { id: 'partitioning', label: 'Partitioning', icon: FileSearch },
  { id: 'chunking', label: 'Chunking', icon: SplitSquareVertical },
  { id: 'vectorization', label: 'Vectorization & Storage', icon: Database },
  { id: 'view_chunks', label: 'View Chunks', icon: FileText },
]


// PLACEHOLDER DATA - Replace with API calls later
const PLACEHOLDER_STAGE_DATA = {
  partitioning: {
    text_sections: 166,
    tables: 4,
    images: 7,
    titles: 30,
    other: 13
  },
  chunking: {
    atomic_elements: 220,
    chunks_created: 25,
    avg_chunk_size: 1800
  },
  summarisation: {
    summaries_generated: 25
  },
  vectorization: {
    vectors_created: 25,
    embedding_model: "text-embedding-3-small"
  }
}


const PLACEHOLDER_CHUNKS = [
  {
    content: "1 Introduction Recurrent neural networks, long short-term memory [13] and gated recurrent [7] neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation [35, 2, 5].",
    type: "text",
    page: 2,
    chars: 1924,
    source: "attention-is-all-you-need.pdf"
  },
  {
    content: "2 Background The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU [16], ByteNet [18] and ConvS2S [9], all of which use convolutional neural networks as basic building block, computing hidden representations in parallel for all input and output positions.",
    type: "text",
    page: 2,
    chars: 1832,
    source: "attention-is-all-you-need.pdf"
  },
  {
    content: "### Searchable Description for Document Content on Neural Sequence Transduction Models #### Question Variations this Content Answers: - What is the architecture of a neural sequence transduction model? - How does the encoder-decoder work in sequence modeling?",
    type: "text",
    page: 2,
    chars: 2464,
    source: "attention-is-all-you-need.pdf"
  },
  {
    content: "[Table] Model Architecture Comparison\nTransformer vs RNN vs CNN",
    type: "table",
    page: 3,
    chars: 856,
    source: "attention-is-all-you-need.pdf"
  },
  {
    content: "3 Model Architecture Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence to a continuous representation, which is then decoded.",
    type: "text",
    page: 3,
    chars: 1349,
    source: "attention-is-all-you-need.pdf"
  },
]


/*
API STRUCTURE - To be implemented:


1. Get Stage Data:
   GET /files/stage-data/{task_id}/{stage}
   Response:
   {
     "partitioning": {
       "text_sections": 166,
       "tables": 4,
       "images": 7,
       "titles": 30,
       "other": 13
     }
   }


2. Get Chunks by Files:
   GET /files/chunks-by-files/?file_names=file1.pdf&file_names=file2.pdf
   Response:
   {
     "chunks": [
       {
         "content": "chunk text content...",
         "type": "text" | "table" | "image",
         "page": 2,
         "chars": 1924,
         "source": "filename.pdf",
         "metadata": {
           "doc_id": 1,
           "ref": "page_2_section_1"
         }
       }
     ]
   }


3. Get Task Status (already implemented but should return stage info):
   GET /files/task/{task_id}
   Response:
   {
     "state": "PROGRESS" | "SUCCESS" | "FAILURE",
     "current_stage": "chunking",
     "progress": 60,
     "status": "Creating chunks..."
   }
*/


export function ProcessingDialog({ open, onOpenChange, files, batch }) {
  const [activeTab, setActiveTab] = useState('upload')
  const [taskStatus, setTaskStatus] = useState(null)
  const [stagesData, setStagesData] = useState(PLACEHOLDER_STAGE_DATA)
  const [chunks, setChunks] = useState([])
  const [selectedChunk, setSelectedChunk] = useState(null)
  const [chunkFilter, setChunkFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()


  useEffect(() => {
    if (!open || !files) return


    // If no batch (existing files), show as completed
    if (!batch) {
      setActiveTab('upload')
      return
    }


    // TODO: Poll task status for active processing
    // Uncomment when API is ready:
    /*
    const pollInterval = setInterval(async () => {
      try {
        const response = await fileAPI.getTaskStatus(batch.id)
        setTaskStatus(response.data)
        
        if (response.data.state === 'PROGRESS') {
          const currentStage = response.data.current_stage
          setActiveTab(currentStage)
          loadStageData(currentStage, batch.id)
        } else if (response.data.state === 'SUCCESS') {
          setActiveTab('view_chunks')
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error polling task status:', error)
      }
    }, 2000)


    return () => clearInterval(pollInterval)
    */
  }, [open, files, batch])


  const loadStageData = async (stage, taskId) => {
    // TODO: Implement API call
    /*
    try {
      const response = await fileAPI.getStageData(taskId, stage)
      setStagesData(prev => ({
        ...prev,
        [stage]: response.data
      }))
    } catch (error) {
      console.error('Error loading stage data:', error)
    }
    */
  }


  const loadChunks = async () => {
    // TODO: Implement API call to get chunks filtered by file names
    /*
    try {
      const fileNames = files.map(f => f.name)
      const response = await fileAPI.getChunksByFiles(fileNames)
      setChunks(response.data.chunks || [])
    } catch (error) {
      console.error('Error loading chunks:', error)
    }
    */
    
    // Using placeholder data for now
    setChunks(PLACEHOLDER_CHUNKS)
  }


  useEffect(() => {
    if (activeTab === 'view_chunks') {
      loadChunks()
    }
  }, [activeTab])


  const getStageStatus = (stageId) => {
    if (!batch) return 'completed' // Existing files are all completed
    
    const stageIndex = PIPELINE_TABS.findIndex(s => s.id === stageId)
    const currentIndex = PIPELINE_TABS.findIndex(s => s.id === activeTab)
    
    if (taskStatus?.state === 'SUCCESS') return 'completed'
    if (stageIndex < currentIndex) return 'completed'
    if (stageIndex === currentIndex) return 'processing'
    return 'pending'
  }


  const filteredChunks = chunks.filter(chunk => {
    if (chunkFilter !== 'all' && chunk.type !== chunkFilter) return false
    if (searchQuery && !chunk.content?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })


  if (!files || files.length === 0) return null


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw]  max-h-[95vh]  p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {files[0]?.name || 'Processing Pipeline'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Processing Pipeline
              </p>
            </div>
          </div>
        </DialogHeader>


        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs Navigation */}
          <div className="border-b px-4 bg-muted/30">
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
                      ${activeTab === tab.id 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                      }
                      ${status === 'completed' ? 'text-green-600 dark:text-green-400' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>


          {/* Tab Content */}
          <ScrollArea className="flex-1">
            {/* Upload to S3 Tab */}
            {activeTab === 'upload' && (
              <div className="p-15 min-h-[70vh]">
                <div className="max-w-2xl mx-auto text-center space-y-6 ">
                  <div className=" inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Upload to S3</h3>
                    <p className="text-muted-foreground">Uploading file to secure cloud storage</p>
                  </div>
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Step completed successfully</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}


            {/* Queued Tab */}
            {activeTab === 'queued' && (
              <div className="p-12 min-h-[70vh]">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Queued</h3>
                    <p className="text-muted-foreground">File queued for processing</p>
                  </div>
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Step completed successfully</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}


            {/* Partitioning Tab */}
            {activeTab === 'partitioning' && (
              <div className="p-12 min-h-[70vh]">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-semibold">Partitioning</h3>
                    <p className="text-muted-foreground">Processing and extracting text, images, and tables</p>
                  </div>


                  <Card className="border-2 max-h-[50vh] gap-0" >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">Elements Discovered</h4>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <CardSmall className="bg-muted/50  ">
                          <CardContent className="p-4 ">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Text sections</span>
                              <span className="text-2xl font-bold">
                                {stagesData.partitioning?.text_sections || 166}
                              </span>
                            </div>
                          </CardContent>
                        </CardSmall>
                        <CardSmall className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-muted-foreground">Tables</span>
                              <span className="text-2xl font-bold">
                                {stagesData.partitioning?.tables || 4}
                              </span>
                            </div>
                          </CardContent>
                        </CardSmall>
                        <CardSmall className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-muted-foreground">Images</span>
                              <span className="text-2xl font-bold">
                                {stagesData.partitioning?.images || 7}
                              </span>
                            </div>
                          </CardContent>
                        </CardSmall>
                        <CardSmall className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-muted-foreground">Titles/Headers</span>
                              <span className="text-2xl font-bold">
                                {stagesData.partitioning?.titles || 30}
                              </span>
                            </div>
                          </CardContent>
                        </CardSmall>
                        <CardSmall className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-muted-foreground">Other elements</span>
                              <span className="text-2xl font-bold">
                                {stagesData.partitioning?.other || 13}
                              </span>
                            </div>
                          </CardContent>
                        </CardSmall>
                      </div>
                    </CardContent>
                  </Card>


                  <CardSmall className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Step completed successfully</span>
                      </div>
                    </CardContent>
                  </CardSmall>
                </div>
              </div>
            )}


            {/* Chunking Tab */}
            {activeTab === 'chunking' && (
              <div className="p-12 min-h-[70vh]">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-semibold">Chunking</h3>
                    <p className="text-muted-foreground">Creating semantic chunks</p>
                  </div>


                  <Card className="border-2 border-green-200 dark:border-green-900">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2">
                        <SplitSquareVertical className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-700 dark:text-green-400">Chunking Results</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-center gap-8">
                            <div className="text-center">
                              <div className="text-4xl font-bold">
                                {stagesData.chunking?.atomic_elements || 220}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">atomic elements</div>
                            </div>
                            <div className="text-2xl text-muted-foreground">→</div>
                            <div className="text-center">
                              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                                {stagesData.chunking?.chunks_created || 25}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">chunks created</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>


                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Average chunk size</span>
                        <span className="text-sm font-bold">
                          {stagesData.chunking?.avg_chunk_size || 1800} characters
                        </span>
                      </div>


                      <p className="text-xs text-center text-muted-foreground">
                        {stagesData.chunking?.atomic_elements || 220} atomic elements have been chunked by{' '}
                        <span className="font-medium">title</span> to produce{' '}
                        {stagesData.chunking?.chunks_created || 25} chunks
                      </p>
                    </CardContent>
                  </Card>


                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Step completed successfully</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}



            {/* Vectorization Tab */}
            {activeTab === 'vectorization' && (
              <div className="p-12 min-h-[70vh]">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Vectorization & Storage</h3>
                    <p className="text-muted-foreground">Generating embeddings and storing in vector database</p>
                  </div>
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Step completed successfully</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}


            {/* View Chunks Tab */}
            {activeTab === 'view_chunks' && (
              <div className="grid grid-cols-[1fr,1px,350px] h-[calc(95vh-180px)]">
                {/* Chunks List */}
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Content Chunks</h3>
                      <span className="text-sm text-muted-foreground">
                        {filteredChunks.length} of {chunks.length} chunks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={chunkFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChunkFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={chunkFilter === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChunkFilter('text')}
                      >
                        Text
                      </Button>
                      <Button
                        variant={chunkFilter === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChunkFilter('image')}
                      >
                        Image
                      </Button>
                      <Button
                        variant={chunkFilter === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChunkFilter('table')}
                      >
                        Table
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="relative flex-1">
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
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-4 space-y-2">
                      {filteredChunks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No chunks available yet</p>
                          <p className="text-sm mt-1">Chunks will appear here after processing</p>
                        </div>
                      ) : (
                        filteredChunks.map((chunk, idx) => (
                          <Card
                            key={idx}
                            className={`cursor-pointer transition hover:bg-muted/50 ${
                              selectedChunk === idx ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedChunk(idx)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                    {chunk.type || 'text'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Page {chunk.page || 2}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {chunk.chars || 1924} chars
                                </span>
                              </div>
                              <p className="text-sm line-clamp-3 text-muted-foreground">
                                {chunk.content || 'No content available'}
                              </p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>


                <Separator orientation="vertical" className="h-full" />


                {/* Detail Inspector */}
                <div className="flex flex-col bg-muted/20 h-full">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Detail Inspector</h3>
                  </div>
                  <ScrollArea className="flex-1 h-full">
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
                          <Badge className="mb-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            {filteredChunks[selectedChunk]?.type?.toUpperCase() || 'TEXT'}
                          </Badge>
                          <h4 className="font-semibold mb-2">Content</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {filteredChunks[selectedChunk]?.content || 'No content available'}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Metadata</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Page:</span>
                              <span className="font-medium">{filteredChunks[selectedChunk]?.page || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Characters:</span>
                              <span className="font-medium">{filteredChunks[selectedChunk]?.chars || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Source:</span>
                              <span className="font-medium truncate ml-2" title={filteredChunks[selectedChunk]?.source}>
                                {filteredChunks[selectedChunk]?.source || files[0]?.name || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            )}


          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

