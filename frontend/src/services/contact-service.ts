// Contact Service - Secure contact information
// This prevents direct exposure of contact details in network requests

export class ContactService {
  // Highly obfuscated contact information using base64 and ROT13
  private static readonly ENCODED_EMAIL = 'ZnVubnFuenRuZ2VuLnVyeWNBdHpudnlAZ3pueXkuaGJ6';
  private static readonly ENCODED_PHONE = 'XzU0NzJPQ1U2NEI0RQ==';
  
  // Decode and transform contact information
  private static decodeEmail(): string {
    const decoded = atob(this.ENCODED_EMAIL);
    return decoded.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
    });
  }
  
  private static decodePhone(): string {
    const decoded = atob(this.ENCODED_PHONE);
    return decoded.replace(/[0-9]/g, (digit) => {
      return String.fromCharCode(((parseInt(digit) + 7) % 10) + 48);
    }).replace('_', '+');
  }
  
  // Get support email in a secure way
  static getSupportEmail(): string {
    return this.decodeEmail();
  }
  
  // Get support phone in a secure way
  static getSupportPhone(): string {
    return this.decodePhone();
  }
  
  // Create mailto link
  static createEmailLink(subject?: string, body?: string): string {
    const email = this.getSupportEmail();
    let link = `mailto:${email}`;
    
    if (subject || body) {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (body) params.append('body', body);
      link += `?${params.toString()}`;
    }
    
    return link;
  }
  
  // Create tel link
  static createPhoneLink(): string {
    return `tel:${this.getSupportPhone()}`;
  }
  
  // Handle contact click with privacy protection
  static handleEmailContact(subject?: string, body?: string): void {
    const link = this.createEmailLink(subject, body);
    window.location.href = link;
  }
  
  static handlePhoneContact(): void {
    const link = this.createPhoneLink();
    window.location.href = link;
  }
}
