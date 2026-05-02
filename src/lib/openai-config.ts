import { OpenAIConfig } from '@/types';

/**
 * Environment types for different deployment stages
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * Default OpenAI configuration settings by environment
 */
export const DEFAULT_OPENAI_CONFIG: Record<Environment, OpenAIConfig> = {
  development: {
    model: 'gpt-4.1',
    temperature: 0.7,
    maxTokens: 150,
  },
  production: {
    model: 'gpt-4.1',
    temperature: 0.5,
    maxTokens: 200,
  },
  test: {
    model: 'gpt-4.1',
    temperature: 0.1,
    maxTokens: 50,
  },
};

/**
 * Gets the current environment
 */
export const getCurrentEnvironment = (): Environment => {
  const env = process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
};

/**
 * Validates that required environment variables are present and properly formatted
 */
export const validateEnvironment = (): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];
  
  // Check required environment variables
  if (!process.env.OPENAI_API_KEY) {
    return {
      isValid: false,
      error: 'OPENAI_API_KEY environment variable is required',
    };
  }

  // Validate API key format (OpenAI keys start with 'sk-' or 'sk-proj-')
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    return {
      isValid: false,
      error: 'OPENAI_API_KEY appears to be invalid (should start with "sk-" or "sk-proj-")',
    };
  }

  // Validate optional numeric environment variables
  if (process.env.OPENAI_TEMPERATURE) {
    const temp = parseFloat(process.env.OPENAI_TEMPERATURE);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return {
        isValid: false,
        error: 'OPENAI_TEMPERATURE must be a number between 0 and 2',
      };
    }
  }

  if (process.env.OPENAI_MAX_TOKENS) {
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS);
    if (isNaN(maxTokens) || maxTokens < 1 || maxTokens > 4096) {
      return {
        isValid: false,
        error: 'OPENAI_MAX_TOKENS must be a number between 1 and 4096',
      };
    }
  }

  // Check for production-specific requirements
  const currentEnv = getCurrentEnvironment();
  if (currentEnv === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_NAME) {
      warnings.push('NEXT_PUBLIC_APP_NAME is not set for production');
    }
    
    // In production, recommend more conservative settings
    const config = getOpenAIConfig();
    if (config.temperature > 0.8) {
      warnings.push('Consider using lower temperature (≤0.8) in production for more consistent responses');
    }
  }

  return { 
    isValid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Gets OpenAI configuration from environment variables with environment-specific fallbacks
 */
export const getOpenAIConfig = (): OpenAIConfig => {
  const currentEnv = getCurrentEnvironment();
  const defaults = DEFAULT_OPENAI_CONFIG[currentEnv];

  return {
    model: process.env.OPENAI_MODEL || defaults.model,
    temperature: process.env.OPENAI_TEMPERATURE 
      ? parseFloat(process.env.OPENAI_TEMPERATURE) 
      : defaults.temperature,
    maxTokens: process.env.OPENAI_MAX_TOKENS 
      ? parseInt(process.env.OPENAI_MAX_TOKENS) 
      : defaults.maxTokens,
  };
};

/**
 * Logs environment configuration (without sensitive data) for debugging
 */
export const logEnvironmentInfo = (): void => {
  // Environment info logging removed for production
};