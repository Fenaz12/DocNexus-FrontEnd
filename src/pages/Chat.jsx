import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Send, ChevronDown, Wrench, Sparkles } from "lucide-react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Example Questions Configuration
const EXAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "What major event occurred for J.F. Packaging Limited on 30 October 2025?",
    icon: "📦"
  },
  {
    id: 2,
    question: "Who are the in the board of directors at Softlogic?",
    icon: "👥"
  },
  {
    id: 3,
    question: "What was the Earnings per Share (EPS) for Lanka Realty Investments PLC for the quarter ended September 2025?",
    icon: "📊"
  }
];

export default function Chat() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(threadId || null);
  const [loading, setLoading] = useState(false);
  
  // Streaming State
  const [streamingContent, setStreamingContent] = useState('');
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  
  // Refs for consistent access inside closures
  const scrollAreaRef = useRef(null);
  const streamingContentRef = useRef('');
  const thinkingStepsRef = useRef([]);
  const toolCallsRef = useRef([]);
  const currentReasoningRef = useRef('');
  
  // Track which thread is currently displayed
  const displayedThreadRef = useRef(threadId);

  useEffect(() => {
    displayedThreadRef.current = threadId;
  
    if (loading) return;

    if (threadId && threadId !== currentThreadId) {
      console.log("Switched threads, loading from DB...");
      setStreamingContent('');
      setThinkingSteps([]);
      setToolCalls([]);
            
      loadThread(threadId);
      setCurrentThreadId(threadId);
    } else if (!threadId) {
      // New chat - clear everything
      setMessages([]);
      setCurrentThreadId(null);
    }
  }, [threadId, currentThreadId, loading]); 

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent, thinkingSteps, toolCalls]);

  // Transform DB Messages to UI Format
  const transformMessagesForUI = (rawMessages) => {
    if (!rawMessages || rawMessages.length === 0) return [];
    
    const uiMessages = [];
    let i = 0;
    
    while (i < rawMessages.length) {
      const msg = rawMessages[i];
      
      if (msg.type === 'tool' || msg.role === 'tool') {
        i++;
        continue;
      }
      
      if (msg.role === 'user' || msg.type === 'human') {
        uiMessages.push({
          role: 'user',
          content: msg.content
        });
        i++;
        continue;
      }
      
      if (msg.role === 'bot' || msg.type === 'ai' || msg.role === 'assistant') {
        let allThinking = [];
        let allToolCalls = [];
        let finalAnswer = msg.content || '';
        
        const nativeThought = msg.additional_kwargs?.thinking;
        if (nativeThought) {
           allThinking.push(` ${nativeThought}`);
        }

        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
            msg.tool_calls.forEach(tc => {
              allToolCalls.push({
                id: tc.id,
                name: tc.name,
                args: tc.args,
                status: 'completed',
                output: rawMessages.find(m => (m.type==='tool' || m.role==='tool') && m.tool_call_id === tc.id)?.content
              });
            });
        }
        
        uiMessages.push({
          role: 'bot',
          content: finalAnswer,
          thinking: allThinking.length > 0 ? allThinking : undefined,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined
        });
        
        i++;
        continue;
      }
      
      i++;
    }
    
    return uiMessages;
  };

  const loadThread = async (id) => {
    try {
      const { data } = await chatAPI.getThread(id);
      const transformedMessages = transformMessagesForUI(data.messages);
      setMessages(transformedMessages);
      setCurrentThreadId(id);
    } catch (error) {
      console.error('Error loading thread:', error);
      // FIX: If error occurs (likely 401 Unauthorized), force redirect to login
      navigate('/login', { replace: true });
    }
  };

  // Handle Example Question Click
  const handleExampleClick = (question) => {
    if (loading) return;
    setInput(question);
    // Auto-send after setting the input
    setTimeout(() => {
      sendMessageWithText(question);
    }, 50);
  };

  // Send message with custom text (for example questions)
  const sendMessageWithText = async (text) => {
    if (!text.trim() || loading) return;
    
    const userMessage = { role: 'user', content: text };
    
    let messageThreadId = currentThreadId;
    if (!messageThreadId) {
      messageThreadId = crypto.randomUUID();
      setCurrentThreadId(messageThreadId);
      navigate(`/chat/${messageThreadId}`, { replace: true });
      displayedThreadRef.current = messageThreadId;
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Reset Streaming State
    setStreamingContent('');
    setThinkingSteps([]);
    setToolCalls([]);
    
    streamingContentRef.current = '';
    thinkingStepsRef.current = [];
    toolCallsRef.current = [];
    currentReasoningRef.current = '';

    try {
      await chatAPI.sendMessageStream(
        text,
        messageThreadId,
        
        // ON CHUNK RECEIVED
        (chunk) => {
          if (displayedThreadRef.current !== messageThreadId && displayedThreadRef.current !== null) return;
          
          const lines = chunk.split('\n').filter(line => line.trim());

          lines.forEach(line => {
            
            if (line.startsWith('NODE:')) {
              const step = line.slice(5);
              thinkingStepsRef.current.push(`⚙️ ${step}`);
              setThinkingSteps([...thinkingStepsRef.current]);
            }
            
            else if (line.startsWith('THINKING_START')) {
              currentReasoningRef.current = ''; 
              thinkingStepsRef.current.push(` ...`); 
              setThinkingSteps([...thinkingStepsRef.current]);
            }
            
            else if (line.startsWith('THINKING:')) {
              const text = line.slice(9);
              currentReasoningRef.current += text;
              
              const lastIdx = thinkingStepsRef.current.length - 1;
              if (lastIdx >= 0) {
                thinkingStepsRef.current[lastIdx] = ` ${currentReasoningRef.current}`;
                setThinkingSteps([...thinkingStepsRef.current]);
              }
            }
            
            else if (line.startsWith('THINKING_END')) {
               // Optional cleanup
            }
            
            else if (line.startsWith('TOOL_CALL:')) {
              try {
                const tool = JSON.parse(line.slice(10));
                toolCallsRef.current.push({ ...tool, status: 'calling' });
                setToolCalls([...toolCallsRef.current]);
              } catch(e) { console.error(e); }
            }
            
            else if (line.startsWith('TOOL_END:')) {
              try {
                const tool = JSON.parse(line.slice(9));
                const existing = toolCallsRef.current.find(t => t.name === tool.name);
                if (existing) {
                  existing.status = 'completed';
                  existing.output = tool.output;
                }
                setToolCalls([...toolCallsRef.current]);
              } catch(e) { console.error(e); }
            }
            
            else if (line.startsWith('CONTENT:')) {
              const text = line.slice(8);
              streamingContentRef.current += text;
              setStreamingContent(streamingContentRef.current);
            }
          });
        },
        
        // ON COMPLETE
        () => {
          if (displayedThreadRef.current !== messageThreadId && displayedThreadRef.current !== null) return;
          
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              content: streamingContentRef.current,
              thinking: thinkingStepsRef.current.length > 0 ? thinkingStepsRef.current : undefined,
              toolCalls: toolCallsRef.current.length > 0 ? toolCallsRef.current : undefined
            }
          ]);
          
          setStreamingContent('');
          setThinkingSteps([]);
          setToolCalls([]);
          setLoading(false);
          
          window.dispatchEvent(new CustomEvent('newThread', { 
            detail: { 
              id: messageThreadId, 
              title: text.substring(0, 50) + '...',
              date: new Date().toISOString()
            } 
          }));
        },
        
        // ON ERROR
        (err) => { 
          if (displayedThreadRef.current === messageThreadId || displayedThreadRef.current === null) {
            console.error('Stream error:', err);
            setLoading(false);
            // FIX: Handle error during stream setup
            if (err?.response?.status === 401) navigate('/login');
          }
        }
      );
    } catch (error) {
      console.error('Send message error:', error);
      setLoading(false);
      // FIX: Handle error during initialization
      navigate('/login');
    }
  };

  // Send message from input field
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    await sendMessageWithText(input);
  };

  const startNewChat = () => {
    const newThreadId = crypto.randomUUID();
    setCurrentThreadId(newThreadId);
    setMessages([]);
    navigate(`/chat/${newThreadId}`);
  };

  // Message Bubble Component
  const MessageBubble = ({ msg, isLast }) => (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-2`}>
        
        {msg.thinking && msg.thinking.length > 0 && (
          <Collapsible defaultOpen={isLast}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span className="font-semibold">Reasoning Process</span>
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground border-l-2 border-blue-500/30">
                {msg.thinking.map((step, idx) => (
                  <div key={idx} className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                    {step}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <Wrench className="h-3 w-3 text-primary" />
              <span>Used {msg.toolCalls.length} tool{msg.toolCalls.length > 1 ? 's' : ''}</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3">
                {msg.toolCalls.map((tool, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tool.name}
                      </Badge>
                      {tool.status === 'completed' && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                    </div>
                    {tool.output && (
                      <div className="text-xs text-muted-foreground line-clamp-3">
                        Result: {tool.output}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {msg.content && msg.content.trim() && (
          <div
            className={`rounded-lg px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground border shadow-sm'

            }`}
          >
            {msg.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <SidebarProvider>
        <SidebarLeft onNewChat={startNewChat} />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b z-10 border-sidebar-border">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1 ">
                      {messages.length > 0 ? messages[0].content.substring(0, 50) + '...' : 'New Chat'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col h-[calc(100vh-3.5rem)] ">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.length === 0 && !streamingContent && thinkingSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 text-primary/90" />
                    <p className="text-lg font-medium mb-2">How can I help you today?</p>
                    <p className="text-sm text-muted-foreground/70 mb-8">Ask about any questions related to the uploaded documents</p>
                    
                    <div className="grid grid-cols-1 gap-2 max-w-2xl w-full px-4">
                      {EXAMPLE_QUESTIONS.map((example) => (
                        <button
                          key={example.id}
                          onClick={() => handleExampleClick(example.question)}
                          disabled={loading}
                          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:bg-accent hover:border-primary/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-xl flex-shrink-0">{example.icon}</span>
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {example.question}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <MessageBubble key={idx} msg={msg} isLast={idx === messages.length - 1} />
                    ))}
                    
                    {/* STREAMING UI BLOCK */}
                    {(streamingContent || thinkingSteps.length > 0 || toolCalls.length > 0) && (
                      <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="max-w-[80%] space-y-2">
                          
                          {thinkingSteps.length > 0 && (
                            <div className="rounded-lg bg-muted/50 p-3 space-y-2 border-l-2 border-blue-500/30">
                              <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                <span>Reasoning...</span>
                              </div>
                              {thinkingSteps.map((step, idx) => (
                                <div key={idx} className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {step}
                                </div>
                              ))}
                            </div>
                          )}

                          {toolCalls.length > 0 && (
                            <div className="rounded-lg bg-muted/50 p-2 space-y-1">
                              {toolCalls.map((tool, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs h-5">
                                    {tool.name}
                                  </Badge>
                                  {tool.status === 'calling' && <span className="text-xs animate-pulse">Running...</span>}
                                  {tool.status === 'completed' && <span className="text-xs text-green-500">Done</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {streamingContent && (
                            <div className="bg-card border shadow-sm rounded-lg px-4 py-3">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({node, children}) => (
                                      <p style={{whiteSpace: 'pre-wrap', marginBottom: '0.5rem'}}>{children}</p>
                                    ),
                                    strong: ({node, children}) => (
                                      <strong style={{fontWeight: 'bold'}}>{children}</strong>
                                    )
                                  }}
                                >
                                  {streamingContent}
                                </ReactMarkdown>
                                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 bg-background border-sidebar-border " >
              <div className="mx-auto max-w-3xl">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask a question..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
        <SidebarRight />
      </SidebarProvider>
    </div>
  )
}