export interface IReturnData<T> {
    code: number;
    message?: string;
    messages?: string[];
    data?: T;
}

export class ReturnData<T> implements IReturnData<T> {
    code = 200;
    message?: string | undefined;
    messages?: string[];
    data?: T | undefined;

    addMessage(message:string) {
        if (!this.messages) {
            this.messages = [];
        }
        if (message && message.length > 0) {
            this.messages.push(message);
        }
    }

    clear() {
        this.messages = [];
    }
}