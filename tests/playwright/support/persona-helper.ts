import { execFileSync } from 'child_process';
import * as path from 'path';

export class PersonaHelper {
  private static scriptPath = path.resolve(__dirname, '../../../backend/scripts/seed-test-personas.js');

  /**
   * Switches the test user (9354799303) to a specific business persona.
   * @param persona 'admin' | 'fresh' | 'incomplete' | 'complete'
   */
  static switchTo(persona: string) {
    console.log(`🧠 Master Brain: Switching to persona [${persona.toUpperCase()}]`);
    try {
      execFileSync('node', [this.scriptPath, '--as', persona], { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to switch persona: ${error}`);
      throw error;
    }
  }
}
