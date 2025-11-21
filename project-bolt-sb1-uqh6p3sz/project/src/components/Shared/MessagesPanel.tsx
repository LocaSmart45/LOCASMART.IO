import { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail, MailOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Message, Profile } from '../../lib/supabase';

export default function MessagesPanel() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);

  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  async function loadData() {
    if (!profile?.id) return;

    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      setMessages(messagesData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    loadData();
  }

  async function sendMessage() {
    if (!recipientId || !subject || !content) return;

    try {
      await supabase.from('messages').insert([{
        sender_id: profile?.id,
        recipient_id: recipientId,
        subject,
        content,
        read: false,
      }]);

      setRecipientId('');
      setSubject('');
      setContent('');
      setShowCompose(false);
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  const getProfileName = (profileId: string) => {
    const foundProfile = profiles.find(p => p.id === profileId);
    return foundProfile?.full_name || 'Utilisateur inconnu';
  };

  const availableRecipients = profiles.filter(p => {
    if (profile?.role === 'admin') {
      return p.role === 'owner';
    } else {
      return p.role === 'admin';
    }
  });

  const receivedMessages = messages.filter(m => m.recipient_id === profile?.id);
  const sentMessages = messages.filter(m => m.sender_id === profile?.id);
  const unreadCount = receivedMessages.filter(m => !m.read).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <button
          onClick={() => {
            setShowCompose(true);
            setSelectedMessage(null);
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
        >
          <Send className="w-5 h-5 mr-2" />
          Nouveau message
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center justify-between">
              Messages reçus
              {unreadCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {receivedMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun message reçu
              </div>
            ) : (
              receivedMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    setShowCompose(false);
                    if (!message.read) markAsRead(message.id);
                  }}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                    !message.read ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-slate-800 flex items-center">
                      {!message.read ? (
                        <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                      ) : (
                        <MailOpen className="w-4 h-4 mr-2 text-slate-400" />
                      )}
                      {getProfileName(message.sender_id)}
                    </p>
                    <span className="text-xs text-slate-500">
                      {new Date(message.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium truncate">{message.subject}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">{message.content}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Messages envoyés</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {sentMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun message envoyé
              </div>
            ) : (
              sentMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    setShowCompose(false);
                  }}
                  className="w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-slate-800">
                      À: {getProfileName(message.recipient_id)}
                    </p>
                    <span className="text-xs text-slate-500">
                      {new Date(message.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium truncate">{message.subject}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">{message.content}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {showCompose ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Nouveau message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destinataire
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner un destinataire</option>
                  {availableRecipients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role === 'admin' ? 'Conciergerie' : 'Propriétaire'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Sujet du message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Votre message..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={sendMessage}
                  disabled={!recipientId || !subject || !content}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        ) : selectedMessage ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedMessage.subject}</h3>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <p>
                  {selectedMessage.sender_id === profile?.id ? 'À' : 'De'}: {' '}
                  <span className="font-medium">
                    {getProfileName(
                      selectedMessage.sender_id === profile?.id
                        ? selectedMessage.recipient_id
                        : selectedMessage.sender_id
                    )}
                  </span>
                </p>
                <p>
                  {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Sélectionnez un message pour le lire</p>
          </div>
        )}
      </div>
    </div>
  );
}
