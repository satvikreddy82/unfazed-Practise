import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { MessageSquare, Send, CheckCheck, Clock, User, Sparkles } from 'lucide-react';

export const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations.length > 0 && !selectedConversation) {
          selectConversation(res.data.conversations[0]);
        }
      }
    } catch (e) {
      console.warn('Error loading conversations:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const selectConversation = async (conv) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);
    try {
      // Join socket room
      if (socket) {
        socket.emit('join_conversation', { conversationId: conv._id });
      }

      const res = await axios.get(`/api/chat/messages/${conv._id}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (e) {
      console.warn('Error loading messages:', e.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Socket listener for new incoming messages and typing
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleNewMessage = (msg) => {
      if (msg.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleUserTyping = ({ conversationId, isTyping: typingState }) => {
      if (conversationId === selectedConversation._id) {
        setIsTyping(typingState);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, selectedConversation]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversation) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      if (socket) {
        socket.emit('typing_stop', { conversationId: selectedConversation._id });
      }

      const res = await axios.post(`/api/chat/messages/${selectedConversation._id}`, {
        text: textToSend,
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (e) {
      alert('Failed to send message.');
    }
  };

  return (
    <div className="h-[700px] rounded-2xl border border-border bg-surface flex overflow-hidden shadow-card">
      {/* Left Column: Conversations List */}
      <div className="w-80 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Client Messages</h2>
          <p className="text-[11px] text-text-muted mt-0.5">Secure clinical messaging</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="p-4">
              <LoadingSkeleton count={3} className="h-14 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No conversations started yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversation?._id === conv._id;
              const otherParty = user?.role === 'therapist' ? conv.clientId : conv.therapistId;

              return (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  role="button"
                  tabIndex={0}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left ${
                    isSelected ? 'bg-surface-elevated font-semibold' : 'hover:bg-surface-elevated/40'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">
                    {otherParty?.name ? otherParty.name[0] : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-text truncate">{otherParty?.name || 'Client'}</span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {conv.lastMessageText || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Chat Stream */}
      <div className="flex-1 flex flex-col bg-background/50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-14 px-6 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                  {selectedConversation.clientId?.name ? selectedConversation.clientId.name[0] : 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-text">{selectedConversation.clientId?.name}</h3>
                  <p className="text-[10px] text-text-muted">{selectedConversation.clientId?.email}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <LoadingSkeleton count={3} className="h-12 w-3/4" />
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-text-muted">
                  <MessageSquare className="w-8 h-8 text-text-muted mb-2 opacity-50" />
                  <p>Send a message to initiate clinical communication.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-subtle ${
                          isMe
                            ? 'bg-primary text-white rounded-br-xs'
                            : 'bg-surface border border-border text-text rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-text-muted/70 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="text-[10px] text-text-muted italic flex items-center gap-1">
                  <span className="animate-pulse">Client is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 text-xs rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
              <Button type="submit" variant="primary" size="sm" icon={Send}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">
            Select a client conversation on the left to view messages.
          </div>
        )}
      </div>
    </div>
  );
};
