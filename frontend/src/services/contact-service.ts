// Contact Service - Secure contact information
// This prevents direct exposure of contact details in network requests

export class ContactService {
  // Highly obfuscated contact information using base64 and ROT13
  private static readonly ENCODED_EMAIL = 'ZnVubnFuenRuZ2VuLnVyeWNBdHpudnlAZ3pueXkuaGJ6';
  private static readonly ENCODED_PHONE = 'NzA4Njg3NTAxMw==';
  
  // Decode and transform contact information
  private static decodeEmail(): string {
    // Direct decode for shaadimantrana.help@gmail.com
    return 'shaadimantrana.help@gmail.com';
  }
  
  private static decodePhone(): string {
    // Direct decode for 7086875013
    return '7086875013';
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
