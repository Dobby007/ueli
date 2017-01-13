import ConfigHelper from './ConfigHelper.js';

export default class WelcomeMessageManager {
    getMessage() {
        let configMessage = new ConfigHelper().getConfig().welcomeMessage;
        return configMessage === undefined
            ? 'What are you looking for?'
            : configMessage;
    }
}