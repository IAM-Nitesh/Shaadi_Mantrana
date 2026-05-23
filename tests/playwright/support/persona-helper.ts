import { execFileSync } from 'child_process';
import * as path from 'path';

export class PersonaHelper {
  private static scriptPath = path.resolve(__dirname, '../../../backend/scripts/seed-test-personas.js');

  /**
   * Switches the test user (9354799303) to a specific business persona.
   * @param persona 'admin' | 'fresh' | 'incomplete' | 'complete'
   */
  static switchTo(persona: string) {
    // @ts-ignore
    const tlog = require('../../../scripts/test-logger');
    tlog.info(`🧠 Master Brain: Switching to persona [${persona.toUpperCase()}]`);
    try {
      execFileSync('node', [this.scriptPath, '--as', persona], { stdio: 'inherit' });
    } catch (error) {
      tlog.error(`❌ Failed to switch persona: ${error}`);
      throw error;
    }
  }
}
