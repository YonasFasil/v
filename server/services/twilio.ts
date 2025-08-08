import twilio from 'twilio';

export class TwilioService {
  private client: twilio.Twilio;
  
  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  // Handle incoming call webhook
  generateIncomingCallResponse(recordingUrl?: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    // Greeting message
    response.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! Thank you for calling Venuine. Please describe your event booking request after the beep, and our AI will process your information.');

    // Record the conversation
    response.record({
      transcribe: true,
      transcribeCallback: '/api/phone/transcription',
      recordingStatusCallback: '/api/phone/recording-complete',
      maxLength: 300, // 5 minutes max
      playBeep: true,
      trim: 'trim-silence'
    });

    // Fallback message
    response.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for your message. We will process your request and contact you shortly. Goodbye!');

    return response.toString();
  }

  // Process completed recording
  async processRecording(recordingSid: string, recordingUrl: string) {
    try {
      // Download the recording
      const recording = await this.client.recordings(recordingSid).fetch();
      
      return {
        sid: recording.sid,
        url: recordingUrl,
        duration: recording.duration,
        dateCreated: recording.dateCreated
      };
    } catch (error) {
      console.error('Error processing recording:', error);
      throw error;
    }
  }

  // Get recording content for AI processing
  async getRecordingContent(recordingUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(recordingUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recording: ${response.statusText}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error fetching recording content:', error);
      throw error;
    }
  }

  // Send SMS notification (optional)
  async sendSMS(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}