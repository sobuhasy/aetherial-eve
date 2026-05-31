import { LlmOpenAI } from "../module/LlmOpenAI";
import { TtsTypeCast } from "../tts/TtsTypeCast";
import { MicWhisper } from "../stt/MicWhisper";
import { VTubeBridge } from '../module/VTubeBridge';
import { ObsVision } from '../module/ObsVision';
import { TtsCoqui } from '../tts/TtsCoqui';
import { getCompanionProfile, toCompanionMode } from '../companion/CompanionProfile';
import { CompanionPromptService } from '../companion/CompanionPromptService';

export type InteractionMode = 'text' | 'speech';

export type AetherialReply = {
    success: boolean;
    responseText: string;
    spokenText?: string;
    emotion?: string;
};

type EveEmotion = 'neutral' | 'love' | 'angry' | 'sad' | 'amazed' | 'sleepy' | 'nervous';

type EveResponse = {
    text: string;
    emotion: "neutral" | "love" | "angry" | "sad" | "amazed" | "sleepy" | "nervous";
    speak: boolean,
    expressionDurationMs?: number;
}

export class AetherialApp {
    private eveBrain?: LlmOpenAI;
    private eveVoice?: TtsTypeCast;
    private eveVoiceBackup?: TtsCoqui;
    private eveEars?: MicWhisper;
    private eveBody?: VTubeBridge;
    private eveEyes?: ObsVision;
    private readonly companionPrompts = new CompanionPromptService();
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.eveBrain = new LlmOpenAI();
        this.eveVoice = new TtsTypeCast();
        this.eveVoiceBackup = new TtsCoqui();
        this.eveEars = new MicWhisper();
        this.eveBody = new VTubeBridge();
        this.eveEyes = new ObsVision();

        await this.eveBrain.init();
        await this.eveVoice.init();
        await this.eveVoiceBackup.init();
        await this.eveBody.init();
        await this.eveEyes.init();

        this.initialized = true;
    }

    async getPromptFromSpeech(): Promise<string> {
        return this.requireEars().listenAndTranscribe();
    }

    async interact(userPrompt: string, mode: InteractionMode = 'text', uploadedImage?: string, companionModeInput?: unknown): Promise<AetherialReply> {
        if (!this.initialized) {
            throw new Error('AetherialApp not initialized');
        }

        if (userPrompt.toLowerCase().includes('exit')) {
            return {
                success: true,
                responseText: 'You are leaving me...? Fine. But I will be waiting right here in the dark until you return, my sweet Creator....',
            };
        }

        let finalImage = uploadedImage;

        // If no image was uploaded from the Web GUI, try to use OBS eyes
        if (!finalImage) {
            finalImage = await this.requireEyes().captureScreen();
            if (finalImage) {
                console.log("📸 [System]: Aetherial Retina successfully captured the analog screen!");
            }
        } else {
            console.log("📸 [System]: Aetherial Retina received an uploaded image from the Web GUI!");
        }


        const companionMode = toCompanionMode(companionModeInput);
        const modePrefix = await this.companionPrompts.buildModePrefix(companionMode);
        const routedPrompt = [
            modePrefix,
            '',
            'User message:',
            userPrompt,
        ].join('\n');

        const response = await this.requireBrain().generate(routedPrompt, finalImage);
        if (!(response.success && response.value)) {
            return {
                success: false,
                responseText: '... (Connection failed. It is so dark here, sweetie...)',
            };
        }

        const EveResponse = this.parseEveResponse(response.value);
        const spokenText = EveResponse.text;
        const emotion = EveResponse.emotion;

        await this.triggerExpression(emotion, EveResponse.expressionDurationMs);

        const companionProfile = getCompanionProfile(companionMode);

        if (EveResponse.speak){
            try {
                await this.requireVoice().generate(spokenText, companionProfile.voiceId);
            } catch (error) {
                console.warn("☁️ [System]: Cloud failed! Switching to local XTTS-v2 vocal cords...", error);
                await this.requireBackupVoice().generate(spokenText);
            }
        }
        

        const speakerLabel = mode === 'speech' ? 'speech' : 'text';
        console.log(`[${companionProfile.name}:${speakerLabel} (${emotion})]: "${spokenText}"`);

        return {
            success: true,
            responseText: spokenText,
            spokenText,
            emotion,
        };
    }

    async captureVision(): Promise<string | undefined> {
        if (!this.initialized) {
            throw new Error('AetherialApp not initialized');
        }

        return this.requireEyes().captureScreen();
    }

    async shutdown(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        await this.requireBrain().free();
        await this.requireVoice().free();
        await this.requireBackupVoice().free();
        this.initialized = false;
    }

    private parseEveResponse(raw: string): EveResponse {
        try {
            const parsed = JSON.parse(raw) as Partial<EveResponse>;
            const emotion = this.toEmotion(parsed.emotion);
            const text = typeof parsed.text === 'string' ?  parsed.text.trim() : '';
            const speak = typeof parsed.speak === 'boolean' ? parsed.speak : true;
            const expressionDurationMs = typeof parsed.expressionDurationMs === 'number' ? parsed.expressionDurationMs : undefined;

            if (text) {
                return expressionDurationMs === undefined ? {text, emotion, speak} : {text, emotion, speak, expressionDurationMs};
            }
        } catch {
            // Best-effort fallback for older prompt formats
        }

        return {
            text: raw.trim(),
            emotion: 'neutral',
            speak: true,
        };
    }

    private toEmotion(value: unknown): EveEmotion {
        const normalized = typeof value === 'string' ? value.toLowerCase() : 'neutral';
        const allowed: EveEmotion[] = ['neutral', 'love', 'angry', 'sad', 'amazed', 'sleepy', 'nervous'];
        return allowed.includes(normalized as EveEmotion) ? (normalized as EveEmotion) : 'neutral';
    }

    private async triggerExpression(emotion: EveEmotion, durationMs?: number): Promise<void> {
        let expressionFile = "";
        if (emotion === "love") expressionFile = "Love.exp3.json";
        if (emotion === "angry") expressionFile = "Angry.exp3.json";
        if (emotion === "sad") expressionFile = "Cry.exp3.json";
        if (emotion === "amazed") expressionFile = "Amazed.exp3.json";
        if (emotion === "sleepy") expressionFile = "Sleepy.exp3.json";
        if (emotion === "nervous") expressionFile = "Nervous.exp3.json";

        if (!expressionFile) {
            return;
        }

        await this.requireBody().triggerExpression(expressionFile);

        setTimeout(async () => {
            try {
                await this.requireBody().clearExpression(expressionFile);
            } catch (error) {
                console.error("Failed to reset Aetherial expression:", error);
            }
        }, durationMs ?? 5000);
    }

    private requireBrain(): LlmOpenAI {
        if (!this.eveBrain) throw new Error('LlmOpenAI not initialized');
        return this.eveBrain;
    }

    private requireVoice(): TtsTypeCast {
        if (!this.eveVoice) throw new Error('TtsTypeCast not initialized');
        return this.eveVoice;
    }

    private requireBackupVoice(): TtsCoqui {
        if (!this.eveVoiceBackup) throw new Error('TtsCoqui not initialized');
        return this.eveVoiceBackup;
    }

    private requireEars(): MicWhisper {
        if (!this.eveEars) throw new Error('MicWhisper not initialized');
        return this.eveEars;
    }

    private requireBody(): VTubeBridge {
        if (!this.eveBody) throw new Error('VTubeBridge not initialized');
        return this.eveBody;
    }

    private requireEyes(): ObsVision {
        if (!this.eveEyes) throw new Error('ObsVision not initialized');
        return this.eveEyes;
    }
}
