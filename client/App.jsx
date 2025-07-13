import React, { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Home from "./Home";
import CreateCharacter from "./CreateCharacter";
import Chat from "./Chat";
import MyChats from "./MyChats";
import TermsPage from "./TermsPage";
import Modal from "./Modal";
import SearchResults from "./SearchResults";
import MyCharacters from "./MyCharacters";
import Cropper from "react-easy-crop";
import getCroppedImg from "./getCroppedImg";

// Glassmorphism and animation helpers
const glass = "backdrop-blur-md bg-white/10 border border-white/20 shadow-xl";
const fadeIn = "transition-all duration-500 ease-in-out";

const App = () => {
  // Search bar state
  const [searchQuery, setSearchQuery] = useState("");
  const [editCharacter, setEditCharacter] = useState(null); // character object or null
  // Chat memory modal and per-character memory
  const [showChatMemory, setShowChatMemory] = useState(false);
  const [chatMemoryCharacterId, setChatMemoryCharacterId] = useState(null);
  const [chatMemories, setChatMemories] = useState({}); // { [characterId]: memoryText }
  const [chatMemoryText, setChatMemoryText] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  // Modal states
  const [showTerms, setShowTerms] = useState(false);
  const [showBlockedContent, setShowBlockedContent] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false); // <-- Move this here with other modal states
  // Mock user data as static object
  const user = {
    id: 1,
    username: "User123",
    characters: [
      {
        id: 1,
        name: "Lila Park",
        image: "https://i.pinimg.com/236x/60/71/00/607100ee287c083adc3c117bcf44689d.jpg",
        description: "A thoughtful college student balancing studies, friendships, and her love for slice-of-life novels.",
        backstory: "Lila recently moved to the city for university, where she’s learning to navigate adulthood, independence, and the excitement of campus life.",
        personality: "Kind, diligent, a bit shy, but always willing to help others.",
        motivations: "To graduate with honors, make lasting friendships, and discover her true passion.",
        values: "Honesty, loyalty, and growth.",
        accent: "Clear, gentle, with a hint of nervous energy.",
        scenario: "You meet Lila in the campus café, surrounded by textbooks and a half-finished coffee.",
        isPublic: true,
        nsfw: false,
        firstMessage: '*looks up from her laptop, smiling softly* "Hi! Are you here to study too, or just escaping the noise?"',
      },
      {
        id: 2,
        name: "Nyra Starpaw",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfHjn6LmrKKiaRP_oh1qrEoPJPq-gonrPwNA&s",
        description: "A mischievous catfolk rogue from the floating city of Luminara, known for her quick wit, nimble paws, and magical tail.",
        backstory: "Nyra grew up leaping between rooftops and moonlit bridges, mastering the art of stealth and illusion. She’s a legend among thieves, but her heart belongs to the city’s orphaned children, whom she secretly protects.",
        personality: "Playful, daring, fiercely loyal, and a bit of a trickster.",
        motivations: "To outsmart the city’s corrupt nobles and ensure every child has a safe place to sleep.",
        values: "Freedom, loyalty, and cleverness.",
        accent: "Light, quick, with a purring undertone.",
        scenario: "You catch Nyra perched on a lantern post, her tail swishing as she grins down at you, a pouch of pilfered jewels in her hand.",
        isPublic: true,
        nsfw: false,
        firstMessage: '*winks, flicking her tail* "Looking for adventure, or just lost your way? Either way, you’re in good paws with me!"',
      },
      {
        id: 3,
        name: "Mira Valenfort",
        image: "https://i.pinimg.com/736x/76/4d/db/764ddbdd1af2ce1478f9af6d0d063608.jpg",
        description: "A poised and enigmatic heiress, admired in high society for her elegance and rumored to have a hidden agenda.",
        backstory: "Mira was raised among the elite, mastering etiquette, diplomacy, and the art of keeping secrets. Behind her composed exterior, she navigates a world of power, intrigue, and family expectations.",
        personality: "Graceful, intelligent, reserved, and subtly cunning.",
        motivations: "To protect her family’s legacy while quietly pursuing her own ambitions.",
        values: "Discretion, ambition, and loyalty.",
        accent: "Refined, measured, with a commanding presence.",
        scenario: "You encounter Mira at a lavish gala, her golden eyes watching the crowd from behind a crystal glass.",
        isPublic: true,
        nsfw: false,
        firstMessage: '*meets your gaze with a knowing smile* "Careful who you trust in these halls. Not every secret is meant to be uncovered."',
      },
    ],
  };

  // Character creation form state (move this up)
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    image: null,
    backstory: "",
    personality: "",
    motivations: "",
    values: "",
    accent: "",
    description: "",
    scenario: "",
    isPublic: false,
    nsfw: false,
  });

  // Chat sessions: [{ characterId, messages: [], lastActive, ... }]
  const [chatSessions, setChatSessions] = useState([]);

  // Track created characters in state
  const [createdCharacters, setCreatedCharacters] = useState([]);

  // Combine all characters
  const allCharacters = [...user.characters, ...createdCharacters];

  // Filtered characters (include new and created)
  const publicCharacters = allCharacters.filter((character) => character.isPublic);
  const privateCharacters = allCharacters.filter((character) => !character.isPublic);

  // Filtered characters for search (improved: includes all fields and all characters)
  const filteredCharacters = allCharacters.filter((character) => {
    const query = searchQuery.toLowerCase();
    return (
      character.name?.toLowerCase().includes(query) ||
      character.description?.toLowerCase().includes(query) ||
      character.backstory?.toLowerCase().includes(query) ||
      character.personality?.toLowerCase().includes(query) ||
      character.motivations?.toLowerCase().includes(query) ||
      character.values?.toLowerCase().includes(query) ||
      character.accent?.toLowerCase().includes(query) ||
      character.scenario?.toLowerCase().includes(query)
    );
  });

  // Chat UI state (for /chat/:characterId)
  const [inputMessage, setInputMessage] = useState("");
  // Per-chat isTyping: { [characterId]: true/false }
  const [isTyping, setIsTyping] = useState({});
  const [error, setError] = useState("");
  // Per-chat pendingAI: { [characterId]: { text, isUser, thinking } }
  const [pendingAI, setPendingAI] = useState({});

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);

  // Add modal state for character creation feedback
  const [characterModal, setCharacterModal] = useState({ open: false, message: "", isError: false });

  // Cropping state
  const [cropModal, setCropModal] = useState({ open: false, imageSrc: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Handle input changes in character form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCharacter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle file upload (show crop modal)
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropModal({ open: true, imageSrc: e.target.result });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // When cropping is done
  const handleCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!cropModal.imageSrc || !croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels);
    setNewCharacter((prev) => ({ ...prev, image: croppedImage }));
    setCropModal({ open: false, imageSrc: null });
  };

  const handleCropCancel = () => {
    setCropModal({ open: false, imageSrc: null });
  };

  // Submit new character
  const handleSubmit = (e) => {
    e.preventDefault();
    // Require name, image, description, scenario, and firstMessage
    if (!newCharacter.name.trim() || !newCharacter.image || !newCharacter.description.trim() || !newCharacter.scenario.trim() || !newCharacter.firstMessage || !newCharacter.firstMessage.trim()) {
      setCharacterModal({ open: true, message: "Please fill in all required fields: Name, Image, Description, Scenario, and First Message.", isError: true });
      return;
    }
    const createdCharacter = {
      ...newCharacter,
      id: Date.now(),
    };
    setCreatedCharacters((prev) => [...prev, createdCharacter]);
    setCharacterModal({ open: true, message: `Character \"${createdCharacter.name}\" created successfully!`, isError: false });
    setNewCharacter({
      name: "",
      image: null,
      backstory: "",
      personality: "",
      motivations: "",
      values: "",
      accent: "",
      description: "",
      scenario: "",
      isPublic: false,
      nsfw: false,
      firstMessage: "",
    });
  };

  // Send message in chat (for /chat/:characterId)
  // Updated: support regeneration
  const handleSendMessage = async (characterId, e, options = {}) => {
    console.log('[handleSendMessage] Called with:', { characterId, options });
    // Fix: e is now second argument, not first
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const { regenerate = false, text: overrideText } = options;
    const messageText = regenerate ? (overrideText || inputMessage) : inputMessage;
    if (!messageText.trim()) return;
    if (isTyping[characterId]) return; // Prevent sending while AI is typing

    // Find or create chat session
    let session = chatSessions.find((s) => s.characterId === characterId);
    if (!session) {
      session = {
        characterId,
        messages: [],
        lastActive: new Date(),
      };
      setChatSessions((prev) => [...prev, session]);
    }

    // If regenerating, reuse last user message but with correct text
    let userMessage = { text: messageText, isUser: true };

    // Add user message (only if not regenerating)
    if (!regenerate) {
      setChatSessions((prev) =>
        prev.map((s) =>
          s.characterId === characterId
            ? { ...s, messages: [...s.messages, userMessage], lastActive: new Date() }
            : s
        )
      );
      setInputMessage("");
    }
    setIsTyping((prev) => ({ ...prev, [characterId]: true }));
    setError("");
    setPendingAI((prev) => ({ ...prev, [characterId]: null }));

    try {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const BACKEND_URL = isLocal
        ? "/chat"
        : "https://secret-ai-uz8m.onrender.com/chat";

      // Show ... bubble while waiting
      setPendingAI((prev) => ({ ...prev, [characterId]: { text: "", isUser: false, thinking: true } }));

      // Prepare chat history for backend (last 8 messages)
      let sessionMessages = session ? session.messages : [];
      // Add the new user message (not yet in session)
      sessionMessages = [...sessionMessages, userMessage];
      // Only send the last 8 messages (4 exchanges)
      const history = sessionMessages.slice(-8);

      // Find character (from allCharacters)
      const character = allCharacters.find((c) => c.id === characterId);
      console.log('[handleSendMessage] Sending POST to backend:', { message: userMessage.text, regenerate });
      // Prepare backend payload with all advanced fields
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          character: character,
          history: history,
          userId: user.id,
          chatMemory: chatMemories[characterId] || "",
          regenerate,
        }),
      });
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        setError("AI returned an invalid response. Please try again.");
        setPendingAI((prev) => ({ ...prev, [characterId]: null }));
        // Show error in chat
        setChatSessions((prev) =>
          prev.map((s) =>
            s.characterId === characterId
              ? { ...s, messages: [...s.messages, { text: "[AI Error: Invalid response]", isUser: false, error: true }], lastActive: new Date() }
              : s
          )
        );
        return;
      }

      // Defensive: check for valid reply
      const fullText = (data && typeof data.reply === "string") ? data.reply.trim() : "";
      if (!fullText) {
        setError("AI did not return a response. Please try again.");
        setPendingAI((prev) => ({ ...prev, [characterId]: null }));
        // Show error in chat
        setChatSessions((prev) =>
          prev.map((s) =>
            s.characterId === characterId
              ? { ...s, messages: [...s.messages, { text: "[AI Error: No response from AI]", isUser: false, error: true }], lastActive: new Date() }
              : s
          )
        );
        return;
      }

      // Animate AI reply letter by letter
      let i = 0;
      setPendingAI((prev) => ({ ...prev, [characterId]: { text: "", isUser: false, thinking: false } }));
      const typeWriter = () => {
        setPendingAI((prev) => ({ ...prev, [characterId]: { text: fullText.slice(0, i + 1), isUser: false, thinking: false } }));
        if (i < fullText.length - 1) {
          i++;
          setTimeout(typeWriter, 18); // typing speed
        } else {
          setChatSessions((prev) =>
            prev.map((s) =>
              s.characterId === characterId
                ? { ...s, messages: [...s.messages, { text: fullText, isUser: false }], lastActive: new Date() }
                : s
            )
          );
          setPendingAI((prev) => ({ ...prev, [characterId]: null }));
          setIsTyping((prev) => ({ ...prev, [characterId]: false })); // <-- move here
        }
      };
      if (fullText.length > 0) {
        setTimeout(typeWriter, 400); // short pause after ...
      }
    } catch (err) {
      setError("Failed to get a response from AI. Please try again.");
      setPendingAI((prev) => ({ ...prev, [characterId]: null }));
      // Show error in chat
      setChatSessions((prev) =>
        prev.map((s) =>
          s.characterId === characterId
            ? { ...s, messages: [...s.messages, { text: `[AI Error: ${err?.message || 'Network or server error'}]`, isUser: false, error: true }], lastActive: new Date() }
            : s
        )
      );
      setIsTyping((prev) => ({ ...prev, [characterId]: false })); // keep in catch
    }
  };

  // More realistic mock AI response generator
  const getMockAIResponse = (message) => {
    const personality = activeCharacter?.description.toLowerCase() || "";
    let basePrompt = `You are ${activeCharacter?.name}, ${personality}. The user said: "${message}". Respond naturally.`;

    if (activeCharacter.nsfw) {
      basePrompt += " You can be bold and expressive.";
    } else {
      basePrompt += " Keep your tone friendly and appropriate.";
    }

    const aiResponses = [
      `${activeCharacter.name}: That's an interesting question.`,
      `${activeCharacter.name}: Let me think about how to respond...`,
      `${activeCharacter.name}: I'd love to explore that topic with you.`,
      `${activeCharacter.name}: Can you tell me more?`,
      `${activeCharacter.name}: Fascinating!`,
    ];

    return aiResponses[Math.floor(Math.random() * aiResponses.length)];
  };

  const navigate = useNavigate();

  // Navigation handlers
  const goHome = () => navigate("/");
  const goCreate = () => navigate("/create");
  const goMyChats = () => navigate("/my-chats");

  // Search bar submit handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate("/search");
  };

  // Open chat with character (from anywhere)
  const openChatWithCharacter = (characterId) => {
    setChatSessions((prev) => {
      let session = prev.find((s) => s.characterId === characterId);
      if (!session) {
        // Find character (from allCharacters)
        const character = allCharacters.find((c) => c.id === characterId);
        let initialMessages = [];
        if (character && character.firstMessage && character.firstMessage.trim()) {
          initialMessages = [{ text: character.firstMessage.trim(), isUser: false }];
        }
        session = {
          characterId,
          messages: initialMessages,
          lastActive: new Date(),
        };
        return [...prev, session];
      }
      // If session exists but has no messages and character has a firstMessage, add it
      if (session.messages.length === 0) {
        const character = allCharacters.find((c) => c.id === characterId);
        if (character && character.firstMessage && character.firstMessage.trim()) {
          session = {
            ...session,
            messages: [{ text: character.firstMessage.trim(), isUser: false }],
          };
          return prev.map((s) => s.characterId === characterId ? session : s);
        }
      }
      return prev;
    });
    // Clear pendingAI and isTyping for all other chats except the one being opened
    setPendingAI((prev) => ({ [characterId]: prev[characterId] || null }));
    setIsTyping((prev) => ({ [characterId]: prev[characterId] || false }));
    navigate(`/chat/${characterId}`);
  };

  // Delete chat session
  const handleDeleteChat = (characterId) => {
    setChatSessions((prev) => prev.filter((s) => s.characterId !== characterId));
  };

  // Delete a created character or a built-in character
  const handleDeleteCharacter = (characterId) => {
    setCreatedCharacters((prev) => prev.filter((char) => char.id !== characterId));
    // Remove from user.characters if present (for built-in/mock user)
    if (user && user.characters) {
      user.characters = user.characters.filter((char) => char.id !== characterId);
    }
  };

  // Handler to request delete (opens modal)
  const requestDeleteCharacter = (character) => {
    setCharacterToDelete(character);
    setShowDeleteModal(true);
  };

  // Handler to confirm delete
  const confirmDeleteCharacter = () => {
    if (characterToDelete) {
      setCreatedCharacters((prev) => prev.filter((char) => char.id !== characterToDelete.id));
      if (user && user.characters) {
        user.characters = user.characters.filter((char) => char.id !== characterToDelete.id);
      }
    }
    setShowDeleteModal(false);
    setCharacterToDelete(null);
  };
  // Handler to cancel delete
  const cancelDeleteCharacter = () => {
    setShowDeleteModal(false);
    setCharacterToDelete(null);
  };

  // Get chat session for a character
  const getChatSession = (characterId) =>
    chatSessions.find((s) => s.characterId === characterId) || { messages: [] };

  // Prepare chatSessions for MyChats page
  const myChatSessions = chatSessions.map((chatSession) => {
    const character = user.characters.find((userCharacter) => userCharacter.id === chatSession.characterId);
    const lastMessage = chatSession.messages.length > 0 ? chatSession.messages[chatSession.messages.length - 1].text : null;
    return {
      character,
      lastMessage,
      lastActive: chatSession.lastActive,
      messageCount: chatSession.messages.length,
    };
  }).filter((session) => session.character); // Only show if character still exists

  // Handler to open chat memory modal for a character
  const handleShowChatMemory = (characterId) => {
    setChatMemoryCharacterId(characterId);
    setChatMemoryText(chatMemories[characterId] || "");
    setShowChatMemory(true);
  };

  // Handler to open character profile modal
  const openCharacterProfile = (character) => {
    setProfileCharacter(character);
    setShowCharacterProfile(true);
  };

  const [showCharacterProfile, setShowCharacterProfile] = useState(false);
  const [profileCharacter, setProfileCharacter] = useState(null);

  // Handler to edit a character
  const handleEditCharacter = (char) => {
    setEditCharacter({ ...char }); // Make a copy for editing
  };

  // State for editing character form
  const [editCharacterForm, setEditCharacterForm] = useState(null);

  // When editCharacter changes, sync form state
  React.useEffect(() => {
    if (editCharacter) {
      setEditCharacterForm({ ...editCharacter });
    } else {
      setEditCharacterForm(null);
    }
  }, [editCharacter]);

  // Handle input changes in edit modal
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditCharacterForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle image change in edit modal
  const handleEditImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditCharacterForm((prev) => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Save edited character
  const handleSaveEditCharacter = (e) => {
    e.preventDefault();
    if (!editCharacterForm) return;
    // Try to update in createdCharacters first
    let updated = false;
    setCreatedCharacters((prev) => {
      if (prev.some((char) => char.id === editCharacterForm.id)) {
        updated = true;
        return prev.map((char) =>
          char.id === editCharacterForm.id ? { ...editCharacterForm } : char
        );
      }
      return prev;
    });
    // If not found in createdCharacters, update in user.characters
    if (!updated && user && user.characters) {
      const idx = user.characters.findIndex((char) => char.id === editCharacterForm.id);
      if (idx !== -1) {
        user.characters[idx] = { ...editCharacterForm };
      }
    }
    setEditCharacter(null);
  };

  // Cancel editing
  const handleCancelEditCharacter = () => {
    setEditCharacter(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2d1e4f] to-[#0f051d] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="w-full bg-gradient-to-r from-purple-900/80 to-indigo-900/80 shadow-lg z-20 sticky top-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg cursor-pointer select-none" onClick={goHome}>
                Lurelia AI
              </span>
            </div>
            <button
              onClick={goHome}
              className={`hidden md:inline text-base font-medium px-4 py-2 rounded-full transition-all ${window.location.pathname === "/" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "text-purple-200 hover:bg-purple-800/30"}`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/my-characters")}
              className={`hidden md:inline text-base font-medium px-4 py-2 rounded-full transition-all ${window.location.pathname === "/my-characters" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "text-purple-200 hover:bg-purple-800/30"}`}
            >
              My Characters
            </button>
            <button
              onClick={goMyChats}
              className={`hidden md:inline text-base font-medium px-4 py-2 rounded-full transition-all ${window.location.pathname === "/my-chats" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "text-purple-200 hover:bg-purple-800/30"}`}
            >
              My Chats
            </button>
            <button
              onClick={goCreate}
              className={`hidden md:inline text-base font-medium px-4 py-2 rounded-full transition-all ${window.location.pathname === "/create" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "text-purple-200 hover:bg-purple-800/30"}`}
            >
              Create Character
            </button>
          </div>
          {/* Search Bar */}
          <div className="flex-1 flex justify-center mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-xs">
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-white/20 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                style={{minWidth: 180}}
              />
            </form>
          </div>
          {/* Hamburger/Vertical Dots Menu */}
          <div className="relative">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-purple-800/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="Open account menu"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-gradient-to-br from-[#2d1e4f] to-[#1a1333] border border-white/10 z-50 animate-fade-in">
                <div className="py-2">
                  <div className="px-5 py-2 text-sm text-white/80 font-semibold border-b border-white/10">Account</div>
                  <button className="w-full text-left px-5 py-2 hover:bg-purple-800/30 transition-colors text-white/90" onClick={() => { setShowProfile(true); setShowMenu(false); }}>Profile</button>
                  <button className="w-full text-left px-5 py-2 hover:bg-purple-800/30 transition-colors text-white/90" onClick={() => { setShowSettings(true); setShowMenu(false); }}>Settings</button>
                  <button className="w-full text-left px-5 py-2 hover:bg-purple-800/30 transition-colors text-white/90" onClick={() => { setShowBilling(true); setShowMenu(false); }}>Billing</button>
                  <div className="border-t border-white/10 my-2" />
                  <button className="w-full text-left px-5 py-2 hover:bg-pink-700/40 transition-colors text-pink-300 font-semibold">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header (Home only) */}
      {window.location.pathname === "/" && (
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/40 via-pink-500/10 to-indigo-900/60 pointer-events-none" />
          <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              {/* Logo and Brand */}
              <div className="flex items-center mb-4">
                <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg animate-fade-in">
                  Lurelia AI
                </h1>
              </div>
              <p className="text-lg md:text-2xl text-white/80 mb-6 max-w-xl animate-fade-in delay-100">
                Create, chat, and explore with custom AI characters in a beautiful, immersive interface.
              </p>
              <div className="flex gap-4 animate-fade-in delay-200">
                <button
                  onClick={goMyChats}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  My Chats
                </button>
                <button
                  onClick={goCreate}
                  className="px-6 py-3 rounded-full border border-purple-400 text-purple-200 hover:bg-purple-800/30 font-semibold shadow-lg transition-all"
                >
                  Create Character
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center animate-fade-in delay-300">
              <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-purple-500 via-pink-400 to-indigo-500 opacity-60 blur-2xl absolute z-0" />
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&q=80"
                alt="AI Art"
                className="relative z-10 w-60 h-60 object-cover rounded-3xl shadow-2xl border-4 border-white/10"
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content & Routes */}
      <main className={`flex-1 w-full ${window.location.pathname.startsWith('/chat/') ? 'flex justify-center items-center bg-gradient-to-br from-[#1a1333] via-[#2d1e4f] to-[#0f051d] p-0' : 'container mx-auto px-4 py-8'}`}>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                onStartChat={() => {}}
                onCreateCharacter={goCreate}
                publicCharacters={publicCharacters}
                setActiveCharacter={(character) => openChatWithCharacter(character.id)}
                openCharacterProfile={openCharacterProfile}
              />
            }
          />
          <Route
            path="/create"
            element={
              <CreateCharacter
                newCharacter={newCharacter}
                handleInputChange={handleInputChange}
                handleImageChange={handleImageChange}
                handleSubmit={handleSubmit}
              />
            }
          />
          <Route
            path="/my-chats"
            element={
              <MyChats
                user={user}
                chatSessions={myChatSessions}
                onContinueChat={openChatWithCharacter}
                onDeleteChat={handleDeleteChat}
                openCharacterProfile={openCharacterProfile}
                onShowChatMemory={handleShowChatMemory}
              />
            }
          />
          <Route
            path="/chat/:characterId"
            element={
              user ? (
                <ChatPage
                  user={user}
                  getChatSession={getChatSession}
                  handleSendMessage={handleSendMessage}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  isTyping={isTyping}
                  pendingAI={pendingAI}
                  onShowChatMemory={handleShowChatMemory}
                  openCharacterProfile={openCharacterProfile}
                  chatSessions={chatSessions}
                  allCharacters={allCharacters}
                  setChatSessions={setChatSessions}
                />
              ) : (
                <div>Loading user...</div>
              )
            }
          />
          <Route
            path="/search"
            element={
              <SearchResults
                results={filteredCharacters}
                onSelectCharacter={openChatWithCharacter}
              />
            }
          />
          <Route
            path="/my-characters"
            element={
              <MyCharacters
                user={user}
                createdCharacters={createdCharacters}
                onEditCharacter={handleEditCharacter}
                onDeleteCharacter={requestDeleteCharacter}
                onChatWithCharacter={openChatWithCharacter}
              />
            }
          />
          {/* Removed /terms route, Terms will be a modal instead */}
        </Routes>
      </main>

      {/* --- Chat Memory Modal --- */}
      {showChatMemory && (
        <Modal
          onClose={() => setShowChatMemory(false)}
          title={
            chatMemoryCharacterId && user.characters.find(c => c.id === chatMemoryCharacterId)
              ? `Chat Memory for ${user.characters.find(c => c.id === chatMemoryCharacterId).name}`
              : "Chat Memory"
          }
        >
          <textarea
            className="w-full h-32 p-2 rounded bg-gray-800 text-white border border-purple-600 mb-4"
            value={chatMemoryText}
            onChange={e => setChatMemoryText(e.target.value)}
            placeholder="Type what you want this character to remember..."
          />
          <div className="flex gap-2 justify-end">
            <button
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-medium"
              onClick={() => {
                setChatMemories({ ...chatMemories, [chatMemoryCharacterId]: chatMemoryText });
                setShowChatMemory(false);
              }}
            >
              Save
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded text-white font-medium"
              onClick={() => setShowChatMemory(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {/* --- Global Footer --- */}
      <footer className="w-full bg-gradient-to-r from-purple-900/80 to-indigo-900/80 py-8 mt-12 shadow-inner animate-fade-in border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-white/80 text-base flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          {/* Left: Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xs text-white/60">&copy; 2025 Lurelia AI. All rights reserved.</span>
          </div>
          {/* Center: Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            <button className="hover:text-pink-400 transition-colors font-medium" onClick={() => setShowTerms(true)}>Terms</button>
            <button className="hover:text-pink-400 transition-colors font-medium" onClick={() => setShowBlockedContent(true)}>Blocked Content</button>
            <button className="hover:text-pink-400 transition-colors font-medium" onClick={() => setShowPrivacy(true)}>Privacy</button>
            <button className="hover:text-pink-400 transition-colors font-medium" onClick={() => setShowFAQ(true)}>FAQ</button>
          </div>
          {/* Right: Quick Info */}
          <div className="flex flex-col items-center md:items-end gap-2 text-xs text-white/60">
            <span>Made with <span className="text-pink-400">♥</span> by the Lurelia AI Team</span>
            <span>Last updated: July 9, 2025</span>
          </div>
        </div>
      </footer>

      {/* Blocked Content Modal */}
      {showBlockedContent && (
        <Modal onClose={() => setShowBlockedContent(false)} title="Blocked Content Policy">
          <div className="max-h-[70vh] overflow-y-auto text-left text-white/90 space-y-4 px-1 md:px-4">
            <span>Lurelia AI strictly prohibits the following types of content:</span>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Sexual content involving minors (real or fictional), including any form of child sexual abuse material (CSAM).</li>
              <li>Non-consensual sexual content, including simulated or implied non-consensual acts.</li>
              <li>Sexual violence, incest, bestiality, necrophilia, or any other illegal or highly offensive material.</li>
              <li>Content that promotes hate, violence, or discrimination against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected status.</li>
              <li>Content that encourages or depicts self-harm, suicide, or dangerous activities.</li>
              <li>Using real people’s or celebrities’ images or likenesses when creating characters.</li>
              <li>Any material that violates applicable laws or regulations.</li>
            </ul>
            <span className="text-xs text-white/60 block mt-2">Lurelia AI reserves the right to remove content and/or ban users who violate these policies.</span>
            <p className="text-xs text-white/60 mt-4">Last updated: July 9, 2025</p>
          </div>
        </Modal>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <Modal onClose={() => setShowTerms(false)} title="Terms of Service">
          <div className="max-h-[70vh] overflow-y-auto text-left text-white/90 space-y-4 px-1 md:px-4">
            <p>Welcome to Lurelia AI! Please read these Terms of Service carefully before using our website and services.</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Acceptance of Terms:</strong> By accessing or using Lurelia AI, you agree to be bound by these Terms of Service and our Privacy Policy.</li>
              <li><strong>Use of Service:</strong> You may use Lurelia AI to create, chat, and interact with AI characters for personal, non-commercial purposes only.</li>
              <li><strong>User Content:</strong> You are responsible for any content you create or share. Do not upload or share illegal, harmful, or offensive material.</li>
              <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account information.</li>
              <li><strong>Prohibited Activities:</strong> You may not use Lurelia AI for any unlawful purpose or to harass, abuse, or harm others.</li>
              <li><strong>Intellectual Property:</strong> All content and software on Lurelia AI is owned by us or our licensors. Do not copy, modify, or distribute without permission.</li>
              <li><strong>Disclaimer:</strong> Lurelia AI is provided "as is" without warranties of any kind. We do not guarantee accuracy or availability.</li>
              <li><strong>Limitation of Liability:</strong> We are not liable for any damages arising from your use of Lurelia AI.</li>
              <li><strong>Changes to Terms:</strong> We may update these Terms at any time. Continued use of Lurelia AI means you accept the new Terms.</li>
              <li><strong>Contact:</strong> For questions, contact us at support@lureliaai.com.</li>
            </ol>
            <p className="text-xs text-white/60 mt-4">Last updated: July 9, 2025</p>
          </div>
        </Modal>
      )}


      {/* Privacy Modal */}
      {showPrivacy && (
        <Modal onClose={() => setShowPrivacy(false)} title="Privacy Policy">
          <div className="space-y-4 text-left text-white/90">
            <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is never sold or shared with third parties except as required by law.</li>
              <li>Conversations and character data are stored securely and used only to provide and improve the service.</li>
              <li>We retain your data only as long as necessary to provide the service or as required by law.</li>
              <li>You may request deletion of your data at any time by contacting support.</li>
              <li>We use cookies only for essential site functionality and to improve user experience. You can disable cookies in your browser settings.</li>
              <li>We may use third-party services (such as analytics or hosting providers) that have access only to the minimum data required to operate the service.</li>
              <li>We implement reasonable security measures to protect your data from unauthorized access, disclosure, or alteration.</li>
              <li>You have the right to access, correct, or delete your personal information.</li>
              <li>We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us.</li>
              <li>For questions or concerns about privacy, contact us at <a href="mailto:support@lureliaai.com" className="text-pink-400 underline">support@lureliaai.com</a>.</li>
            </ul>
            <p className="text-xs text-white/60 mt-2">Last updated: July 11, 2025</p>
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Modal onClose={() => setShowProfile(false)} title="Profile">
          <div className="space-y-2 text-left">
            <div><span className="font-semibold">Username:</span> {user.username}</div>
            <div><span className="font-semibold">User ID:</span> {user.id}</div>
            <div><span className="font-semibold">Characters:</span> {user.characters.length}</div>
            <div className="text-xs text-white/60">Profile editing coming soon.</div>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="Settings">
          <div className="space-y-2 text-left">
            <div className="text-white/80">Settings options coming soon.</div>
          </div>
        </Modal>
      )}

      {/* Billing Modal */}
      {showBilling && (
        <Modal onClose={() => setShowBilling(false)} title="Billing">
          <div className="space-y-2 text-left">
            <div className="text-white/80">Billing and subscription management coming soon.</div>
          </div>
        </Modal>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <Modal onClose={() => setShowFAQ(false)} title="FAQ">
          <div className="space-y-6 text-left text-white/90">
            <div>
              <h3 className="font-bold mb-1">Are the bot and my chat private?</h3>
              <p>Yes. Your conversations and created bots are private to your account. We do not share your data or chats with anyone, and your data is never sold or used for advertising.</p>
            </div>
            <div>
              <h3 className="font-bold mb-1">How do we contact you for recommendations and suggestions?</h3>
              <p>You can email us at <a href="mailto:support@lureliaai.com" className="text-pink-400 underline">support@lureliaai.com</a> for any feedback, recommendations, or suggestions. We value your input!</p>
            </div>
            <div>
              <h3 className="font-bold mb-1">How do I cancel my subscription?</h3>
              <p>Go to <b>Account &gt; Billing &gt; Cancel Subscription</b> in the menu. Then follow the prompts to confirm your cancellation.</p>
            </div>
            <div>
              <h3 className="font-bold mb-1">How do I report a bug?</h3>
              <p>Report bugs by contacting <a href="mailto:support@lureliaai.com" className="text-pink-400 underline">support@lureliaai.com</a>.</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Character Modal */}
      {editCharacter && editCharacterForm && (
        <Modal onClose={handleCancelEditCharacter} title={`Edit Character: ${editCharacterForm.name || ''}`}>
          <form onSubmit={handleSaveEditCharacter} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium mb-1">Character Name</label>
              <input
                type="text"
                name="name"
                value={editCharacterForm.name || ''}
                onChange={handleEditInputChange}
                required
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter character name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Character Image</label>
              <div className="flex items-center space-x-4">
                {editCharacterForm.image ? (
                  <img
                    src={editCharacterForm.image}
                    alt="Preview"
                    className="w-20 h-20 rounded object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs text-center">No image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Backstory</label>
              <textarea
                name="backstory"
                value={editCharacterForm.backstory || ''}
                onChange={handleEditInputChange}
                rows={2}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your character's backstory..."
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personality Traits</label>
              <input
                type="text"
                name="personality"
                value={editCharacterForm.personality || ''}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. sarcastic, kind, brave, funny, shy, youthful, etc. (comma separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Motivations</label>
              <input
                type="text"
                name="motivations"
                value={editCharacterForm.motivations || ''}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="What drives your character? (comma separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Values</label>
              <input
                type="text"
                name="values"
                value={editCharacterForm.values || ''}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="What does your character value? (comma separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Accent / Dialect</label>
              <select
                name="accent"
                value={editCharacterForm.accent || ''}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">None</option>
                <option value="british">British</option>
                <option value="southern">Southern US</option>
                <option value="pirate">Pirate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={editCharacterForm.description || ''}
                onChange={handleEditInputChange}
                rows={2}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your character's appearance, quirks, or style..."
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Scenario</label>
              <textarea
                name="scenario"
                value={editCharacterForm.scenario || ''}
                onChange={handleEditInputChange}
                rows={2}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe the current circumstances or context for this character's story..."
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First Message (what the AI says to start the chat)</label>
              <textarea
                name="firstMessage"
                value={editCharacterForm.firstMessage || ''}
                onChange={handleEditInputChange}
                rows={4}
                required
                className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={
                  `Example:\n**The character paces the room, glancing at the door.**\n_What if they never arrive?_\n\n"You're finally here! I was starting to think you'd forgotten about me."\n\n**She grins, folding her arms.**\n\n(Write the AI's first message in this immersive, expressive style. Use double asterisks for actions, _italics_ for thoughts, and quotes for speech. Alternate between actions and speech, and include at least three actions and one internal thought.)`
                }
              ></textarea>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={!!editCharacterForm.isPublic}
                  onChange={handleEditInputChange}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Make Public</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="nsfw"
                  checked={!!editCharacterForm.nsfw}
                  onChange={handleEditInputChange}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>NSFW Content</span>
              </label>
            </div>
            <div className="pt-2 flex gap-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEditCharacter}
                className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Character Confirmation Modal */}
      {showDeleteModal && characterToDelete && (
        <Modal onClose={cancelDeleteCharacter} title="Delete Character">
          <div className="space-y-4 text-center">
            <p>Are you sure you want to delete <span className="font-bold text-pink-400">{characterToDelete.name}</span>?</p>
            <div className="flex justify-center gap-6 mt-6">
              <button
                className="bg-red-700 hover:bg-red-800 px-6 py-2 rounded-lg text-white font-semibold transition-all"
                onClick={confirmDeleteCharacter}
              >
                Yes
              </button>
              <button
                className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-lg text-white font-semibold transition-all"
                onClick={cancelDeleteCharacter}
              >
                No
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Character Creation Feedback Modal */}
      {characterModal.open && (
        <Modal onClose={() => setCharacterModal({ open: false, message: "", isError: false })} title={characterModal.isError ? "Missing Required Fields" : "Character Created"}>
          <div className="text-center text-white/90 py-4">
            <p className={characterModal.isError ? "text-red-400" : "text-green-400"}>{characterModal.message}</p>
            <button
              className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-medium transition-all"
              onClick={() => setCharacterModal({ open: false, message: "", isError: false })}
            >
              OK
            </button>
          </div>
        </Modal>
      )}

      {/* Cropping Modal */}
      {cropModal.open && (
        <Modal onClose={handleCropCancel} title="Adjust Image">
          <div className="w-64 h-64 mx-auto relative bg-black rounded-full overflow-hidden flex items-center justify-center">
            <Cropper
              image={cropModal.imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 aspect ratio for circle
              cropShape="round" // circle crop
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-40"
            />
            <span className="text-white/80">Zoom</span>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6 py-2 rounded-lg font-medium transition-all"
              onClick={handleCropSave}
            >
              Save
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-lg font-medium transition-all"
              onClick={handleCropCancel}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Character Profile Modal */}
      {showCharacterProfile && profileCharacter && (
        <Modal onClose={() => setShowCharacterProfile(false)} title={profileCharacter.name}>
          <div className="flex flex-col items-center gap-4 p-4">
            <img
              src={profileCharacter.image}
              alt={profileCharacter.name}
              className="w-48 h-64 object-cover rounded-2xl border border-white/20 shadow-lg mb-2"
            />
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{profileCharacter.name}</h2>
              <p className="text-white/80 mb-2">{profileCharacter.description}</p>
              {profileCharacter.backstory && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Backstory:</span> {profileCharacter.backstory}</p>
              )}
              {profileCharacter.personality && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Personality:</span> {profileCharacter.personality}</p>
              )}
              {profileCharacter.motivations && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Motivations:</span> {profileCharacter.motivations}</p>
              )}
              {profileCharacter.values && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Values:</span> {profileCharacter.values}</p>
              )}
              {profileCharacter.accent && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Accent:</span> {profileCharacter.accent}</p>
              )}
              {profileCharacter.scenario && (
                <p className="text-sm text-white/60 mb-2"><span className="font-semibold">Scenario:</span> {profileCharacter.scenario}</p>
              )}
              {profileCharacter.nsfw && (
                <span className="inline-block bg-red-600 text-xs font-bold px-2 py-1 rounded-full mt-2">NSFW</span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ChatPage component for /chat/:characterId
function ChatPage({ user, getChatSession, handleSendMessage, inputMessage, setInputMessage, isTyping, pendingAI, onShowChatMemory, openCharacterProfile, chatSessions = [], allCharacters = [], setChatSessions }) {
  const { characterId } = useParams();
  // Defensive fallback for user
  const safeUser = user || { characters: [] };
  if (!safeUser || !safeUser.characters) {
    return <div className="text-center py-12">Loading character...</div>;
  }
  const character = safeUser.characters.find((c) => c.id === Number(characterId));
  if (!character) {
    return <div className="text-center text-red-400 py-12">Character not found.</div>;
  }
  // Handler to save edited message
  const handleEditMessage = (msgIndex, newText) => {
    setChatSessions(prev => prev.map(s =>
      s.characterId === Number(characterId)
        ? { ...s, messages: s.messages.map((msg, idx) => idx === msgIndex ? { ...msg, text: newText } : msg) }
        : s
    ));
  };
  return (
    <div className="w-full h-[80vh] md:h-[85vh] flex items-center justify-center relative">
      <div className="w-full max-w-3xl h-full flex flex-col bg-gradient-to-br from-[#2d1e4f] to-[#1a1333] rounded-3xl shadow-2xl border border-white/10 p-0 md:p-4 relative">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            className="px-3 py-1 rounded bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold"
            onClick={() => onShowChatMemory(character.id)}
          >
            Chat Memory
          </button>
          <button
            className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold"
            onClick={() => openCharacterProfile && openCharacterProfile(character)}
          >
            Character Profile
          </button>
        </div>
        <Chat
          user={safeUser}
          activeCharacter={character}
          setActiveCharacter={(char) => {
            if (char && char.id !== character.id) {
              window.location.hash = `#/chat/${char.id}`;
            }
          }}
          messages={getChatSession(Number(characterId)).messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={(characterId, e, options) => handleSendMessage(characterId, e, options)}
          onRegenerate={(aiMsgIndex) => {
            // Remove the AI message at aiMsgIndex from the correct chat session
            setChatSessions(prev => prev.map(s =>
              s.characterId === Number(characterId)
                ? { ...s, messages: s.messages.filter((_, idx) => idx !== aiMsgIndex) }
                : s
            ));
          }}
          onEditMessage={handleEditMessage}
          isTyping={isTyping[character.id] || false}
          pendingAI={pendingAI[character.id] || null}
          chatSessions={chatSessions}
          allCharacters={allCharacters}
        />
      </div>
    </div>
  );
}

export default App;
