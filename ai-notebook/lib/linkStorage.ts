// lib/linkStorage.ts

/**
 * Type definitions for recording links
 */
interface RecordingLink {
    id: string;
    userId: string;
    title: string;
    description: string;
    expiresAt: string;
    maxUses: number;
    usedCount: number;
    createdAt: string;
  }
  
  interface LinkData {
    title?: string;
    description?: string;
    expiresInDays?: number;
    maxUses?: number;
  }
  
  interface LinkValidation {
    valid: boolean;
    reason?: string;
    link?: RecordingLink;
  }
  
  // Storage key for links
  const LINKS_STORAGE_KEY = 'audio_notebook_recording_links';
  
  /**
   * Generate a random token
   */
  function generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Create a new recording link
   * @param linkData - Link data (title, description, expiration)
   * @param userId - The teacher's user ID
   * @returns The created link data with token
   */
  export function createRecordingLink(linkData: LinkData, userId: string): RecordingLink {
    // Load existing links
    const links = getAllLinks();
    
    // Calculate expiration date (default: 7 days)
    const expiresInDays = linkData.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Create new link object
    const newLink: RecordingLink = {
      id: generateToken(),
      userId: userId,
      title: linkData.title || 'Audio Recording',
      description: linkData.description || '',
      expiresAt: expiresAt.toISOString(),
      maxUses: linkData.maxUses || 50,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    links.push(newLink);
    saveLinks(links);
    
    return newLink;
  }
  
  /**
   * Get a link by its token/id
   * @param token - The link token/id
   * @returns The link data or null if not found
   */
  export function getLinkByToken(token: string): RecordingLink | null {
    const links = getAllLinks();
    return links.find(link => link.id === token) || null;
  }
  
  /**
   * Get all links for a specific user
   * @param userId - The teacher's user ID
   * @returns Array of link objects
   */
  export function getLinksByUser(userId: string): RecordingLink[] {
    const links = getAllLinks();
    return links.filter(link => link.userId === userId);
  }
  
  /**
   * Update a link's usage count
   * @param token - The link token/id
   * @returns The updated link or null if not found
   */
  export function incrementLinkUsage(token: string): RecordingLink | null {
    const links = getAllLinks();
    const linkIndex = links.findIndex(link => link.id === token);
    
    if (linkIndex === -1) return null;
    
    links[linkIndex].usedCount += 1;
    saveLinks(links);
    
    return links[linkIndex];
  }
  
  /**
   * Delete a link
   * @param token - The link token/id
   * @param userId - The teacher's user ID
   * @returns Success/failure
   */
  export function deleteLink(token: string, userId: string): boolean {
    const links = getAllLinks();
    const filteredLinks = links.filter(link => 
      !(link.id === token && link.userId === userId)
    );
    
    if (filteredLinks.length === links.length) {
      return false; // No link was removed
    }
    
    saveLinks(filteredLinks);
    return true;
  }
  
  /**
   * Check if a link is valid (exists, not expired, not maxed out)
   * @param token - The link token/id
   * @returns Status object with validity and reason
   */
  export function validateLink(token: string): LinkValidation {
    const link = getLinkByToken(token);
    
    if (!link) {
      return { valid: false, reason: 'Link not found' };
    }
    
    // Check expiration
    if (new Date(link.expiresAt) < new Date()) {
      return { valid: false, reason: 'Link has expired' };
    }
    
    // Check usage limit
    if (link.usedCount >= link.maxUses) {
      return { valid: false, reason: 'Link has reached maximum usage limit' };
    }
    
    return { valid: true, link };
  }
  
  /**
   * Get all links from localStorage
   * @returns Array of link objects
   */
  function getAllLinks(): RecordingLink[] {
    if (typeof window === 'undefined') {
      // We're on the server side, return empty array
      return [];
    }
    
    try {
      const linksJson = localStorage.getItem(LINKS_STORAGE_KEY);
      return linksJson ? JSON.parse(linksJson) : [];
    } catch (error) {
      console.error('Error loading links from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Save links to localStorage
   * @param links - Array of link objects
   */
  function saveLinks(links: RecordingLink[]): void {
    if (typeof window === 'undefined') {
      // We're on the server side, do nothing
      return;
    }
    
    try {
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
    } catch (error) {
      console.error('Error saving links to localStorage:', error);
    }
  }
  
  /**
   * Clean up expired links
   * This can be called periodically to keep localStorage clean
   */
  export function cleanupExpiredLinks(): void {
    const links = getAllLinks();
    const now = new Date();
    
    const validLinks = links.filter(link => {
      return new Date(link.expiresAt) > now;
    });
    
    if (validLinks.length !== links.length) {
      saveLinks(validLinks);
    }
  }