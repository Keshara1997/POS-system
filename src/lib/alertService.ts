import { supabase } from './supabase';
import {
    AlertRecipient,
    AlertTemplate,
    AlertConfiguration,
    AlertHistory,
    AlertSchedule,
    NotificationServiceConfig,
    InventoryAlert,
    AlertType,
    AlertContext,
    ProcessedAlert,
    Product
} from '../types';

// Email Service Interface
interface EmailService {
    sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// SMS Service Interface
interface SMSService {
    sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// SendGrid Email Service Implementation
class SendGridEmailService implements EmailService {
    private apiKey: string;
    private fromEmail: string;

    constructor(apiKey: string, fromEmail: string) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
    }

    async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: this.fromEmail },
                    subject: subject,
                    content: [{ type: 'text/html', value: body }],
                }),
            });

            if (response.ok) {
                const messageId = response.headers.get('X-Message-Id') || 'unknown';
                return { success: true, messageId };
            } else {
                const error = await response.text();
                return { success: false, error: `SendGrid error: ${error}` };
            }
        } catch (error) {
            return { success: false, error: `Network error: ${error}` };
        }
    }
}

// Twilio SMS Service Implementation
class TwilioSMSService implements SMSService {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;

    constructor(accountSid: string, authToken: string, fromNumber: string) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
    }

    async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    To: to,
                    From: this.fromNumber,
                    Body: message,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, messageId: data.sid };
            } else {
                const error = await response.text();
                return { success: false, error: `Twilio error: ${error}` };
            }
        } catch (error) {
            return { success: false, error: `Network error: ${error}` };
        }
    }
}

// AWS SES Email Service Implementation
class AWSEmailService implements EmailService {
    private accessKeyId: string;
    private secretAccessKey: string;
    private region: string;
    private fromEmail: string;

    constructor(accessKeyId: string, secretAccessKey: string, region: string, fromEmail: string) {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.fromEmail = fromEmail;
    }

    async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // This is a simplified implementation. In production, you'd use AWS SDK
            const response = await fetch(`https://email.${this.region}.amazonaws.com/`, {
                method: 'POST',
                headers: {
                    'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}`,
                    'Content-Type': 'application/x-amz-json-1.0',
                },
                body: JSON.stringify({
                    Destination: { ToAddresses: [to] },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Html: { Data: body } },
                    },
                    Source: this.fromEmail,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, messageId: data.MessageId };
            } else {
                const error = await response.text();
                return { success: false, error: `AWS SES error: ${error}` };
            }
        } catch (error) {
            return { success: false, error: `Network error: ${error}` };
        }
    }
}

// Alert Service Class
export class AlertService {
    private emailService?: EmailService;
    private smsService?: SMSService;

    constructor() {
        this.initializeServices();
    }

    private async initializeServices() {
        try {
            // Get notification service configurations
            const { data: emailConfigs, error: emailError } = await supabase
                .from('notification_service_config')
                .select('*')
                .eq('service_type', 'email')
                .eq('is_active', true)
                .eq('is_default', true)
                .single();

            const { data: smsConfigs, error: smsError } = await supabase
                .from('notification_service_config')
                .select('*')
                .eq('service_type', 'sms')
                .eq('is_active', true)
                .eq('is_default', true)
                .single();

            if (!emailError && emailConfigs) {
                this.emailService = this.createEmailService(emailConfigs);
            }

            if (!smsError && smsConfigs) {
                this.smsService = this.createSMSService(smsConfigs);
            }
        } catch (error) {
            console.error('Error initializing notification services:', error);
        }
    }

    private createEmailService(config: NotificationServiceConfig): EmailService {
        const { serviceName, configData } = config;

        switch (serviceName) {
            case 'sendgrid':
                return new SendGridEmailService(configData.apiKey, configData.fromEmail);
            case 'aws_ses':
                return new AWSEmailService(
                    configData.accessKeyId,
                    configData.secretAccessKey,
                    configData.region,
                    configData.fromEmail
                );
            default:
                throw new Error(`Unsupported email service: ${serviceName}`);
        }
    }

    private createSMSService(config: NotificationServiceConfig): SMSService {
        const { serviceName, configData } = config;

        switch (serviceName) {
            case 'twilio':
                return new TwilioSMSService(
                    configData.accountSid,
                    configData.authToken,
                    configData.fromNumber
                );
            default:
                throw new Error(`Unsupported SMS service: ${serviceName}`);
        }
    }

    // Template processing with variable substitution
    private processTemplate(template: string, context: AlertContext): string {
        const variables = {
            '{{product_name}}': context.product.name,
            '{{product_sku}}': context.product.sku,
            '{{product_category}}': context.product.category,
            '{{current_stock}}': context.product.stock.toString(),
            '{{min_stock}}': context.product.minStock.toString(),
            '{{recipient_name}}': context.recipient.name,
            '{{store_name}}': 'Your Store', // This should come from app settings
            '{{alert_type}}': context.template.type,
            '{{threshold_value}}': context.configuration.thresholdValue?.toString() || '',
        };

        let processedTemplate = template;
        Object.entries(variables).forEach(([placeholder, value]) => {
            processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
        });

        return processedTemplate;
    }

    // Check if alert should be sent (cooldown logic)
    private async shouldSendAlert(
        productId: string,
        alertType: AlertType,
        recipientId: string
    ): Promise<boolean> {
        try {
            const { data, error } = await supabase.rpc('should_send_alert', {
                product_id_param: productId,
                alert_type_param: alertType,
                recipient_id_param: recipientId,
            });

            if (error) {
                console.error('Error checking alert cooldown:', error);
                return false;
            }

            return data || false;
        } catch (error) {
            console.error('Error checking alert cooldown:', error);
            return false;
        }
    }

    // Send email alert
    private async sendEmailAlert(context: AlertContext): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.emailService) {
            return { success: false, error: 'Email service not configured' };
        }

        const subject = this.processTemplate(context.template.subject || '', context);
        const body = this.processTemplate(context.template.body, context);

        return await this.emailService.sendEmail(context.recipient.email!, subject, body);
    }

    // Send SMS alert
    private async sendSMSAlert(context: AlertContext): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.smsService) {
            return { success: false, error: 'SMS service not configured' };
        }

        const message = this.processTemplate(context.template.body, context);
        return await this.smsService.sendSMS(context.recipient.phone!, message);
    }

    // Record alert in history
    private async recordAlertHistory(
        alert: InventoryAlert,
        recipient: AlertRecipient,
        template: AlertTemplate,
        channel: 'email' | 'sms',
        status: 'pending' | 'sent' | 'failed' | 'delivered',
        messageContent?: string,
        errorMessage?: string,
        messageId?: string
    ): Promise<void> {
        try {
            const alertHistory: Omit<AlertHistory, 'id'> = {
                alertType: alert.alertType,
                productId: alert.productId,
                productName: alert.productName,
                productSku: alert.productSku,
                currentStock: alert.currentStock,
                minStock: alert.minStock,
                thresholdValue: alert.thresholdValue,
                recipientId: recipient.id,
                recipientName: recipient.name,
                recipientEmail: recipient.email,
                recipientPhone: recipient.phone,
                channel,
                status,
                templateId: template.id,
                messageContent,
                errorMessage,
                sentAt: status === 'sent' || status === 'delivered' ? new Date() : undefined,
                deliveredAt: status === 'delivered' ? new Date() : undefined,
                createdAt: new Date(),
            };

            await supabase.from('alert_history').insert(alertHistory);
        } catch (error) {
            console.error('Error recording alert history:', error);
        }
    }

    // Main method to process and send alerts
    async processAlert(alert: InventoryAlert): Promise<ProcessedAlert> {
        try {
            // Get alert configuration
            const { data: configuration, error: configError } = await supabase
                .from('alert_configurations')
                .select('*')
                .eq('alert_type', alert.alertType)
                .eq('is_enabled', true)
                .single();

            if (configError || !configuration) {
                return {
                    alert,
                    recipients: [],
                    shouldSend: false,
                    reason: 'Alert configuration not found or disabled',
                };
            }

            // Get recipients for this alert type
            const { data: recipients, error: recipientsError } = await supabase.rpc('get_alert_recipients', {
                alert_type_param: alert.alertType,
            });

            if (recipientsError || !recipients || recipients.length === 0) {
                return {
                    alert,
                    recipients: [],
                    shouldSend: false,
                    reason: 'No active recipients found for this alert type',
                };
            }

            // Get product details
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', alert.productId)
                .single();

            if (productError || !product) {
                return {
                    alert,
                    recipients: [],
                    shouldSend: false,
                    reason: 'Product not found',
                };
            }

            // Get templates
            const { data: emailTemplate, error: emailTemplateError } = await supabase
                .from('alert_templates')
                .select('*')
                .eq('type', alert.alertType)
                .eq('channel', 'email')
                .eq('is_active', true)
                .single();

            const { data: smsTemplate, error: smsTemplateError } = await supabase
                .from('alert_templates')
                .select('*')
                .eq('type', alert.alertType)
                .eq('channel', 'sms')
                .eq('is_active', true)
                .single();

            // Process each recipient
            const processedRecipients: AlertRecipient[] = [];

            for (const recipient of recipients) {
                // Check cooldown
                const shouldSend = await this.shouldSendAlert(alert.productId, alert.alertType, recipient.id);

                if (!shouldSend) {
                    continue;
                }

                processedRecipients.push(recipient);

                // Create alert context
                const context: AlertContext = {
                    product: product as Product,
                    recipient: recipient as AlertRecipient,
                    template: (emailTemplate || smsTemplate) as AlertTemplate,
                    configuration: configuration as AlertConfiguration,
                };

                // Send email if configured and recipient has email
                if (emailTemplate && recipient.email) {
                    const emailResult = await this.sendEmailAlert({
                        ...context,
                        template: emailTemplate as AlertTemplate,
                    });

                    await this.recordAlertHistory(
                        alert,
                        recipient,
                        emailTemplate as AlertTemplate,
                        'email',
                        emailResult.success ? 'sent' : 'failed',
                        emailResult.success ? 'Email sent successfully' : emailResult.error,
                        emailResult.error,
                        emailResult.messageId
                    );
                }

                // Send SMS if configured and recipient has phone
                if (smsTemplate && recipient.phone) {
                    const smsResult = await this.sendSMSAlert({
                        ...context,
                        template: smsTemplate as AlertTemplate,
                    });

                    await this.recordAlertHistory(
                        alert,
                        recipient,
                        smsTemplate as AlertTemplate,
                        'sms',
                        smsResult.success ? 'sent' : 'failed',
                        smsResult.success ? 'SMS sent successfully' : smsResult.error,
                        smsResult.error,
                        smsResult.messageId
                    );
                }
            }

            return {
                alert,
                recipients: processedRecipients,
                shouldSend: processedRecipients.length > 0,
                reason: processedRecipients.length > 0 ? 'Alerts sent successfully' : 'No recipients available or cooldown active',
            };
        } catch (error) {
            console.error('Error processing alert:', error);
            return {
                alert,
                recipients: [],
                shouldSend: false,
                reason: `Error processing alert: ${error}`,
            };
        }
    }

    // Check inventory levels and trigger alerts
    async checkInventoryLevels(): Promise<InventoryAlert[]> {
        try {
            const { data, error } = await supabase.rpc('check_inventory_alerts');

            if (error) {
                console.error('Error checking inventory levels:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error checking inventory levels:', error);
            return [];
        }
    }

    // Run the complete alert check process
    async runAlertCheck(): Promise<ProcessedAlert[]> {
        const alerts = await this.checkInventoryLevels();
        const processedAlerts: ProcessedAlert[] = [];

        for (const alert of alerts) {
            const processedAlert = await this.processAlert(alert);
            processedAlerts.push(processedAlert);
        }

        return processedAlerts;
    }
}

// Export singleton instance
export const alertService = new AlertService();
