import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import { type IParseTreeNode, type IWidgetEvent, type IWidgetInitialiseOptions } from 'tiddlywiki';

class EncryptionAgent extends Widget {
  constructor(
    parseTreeNode: IParseTreeNode,
    options?: IWidgetInitialiseOptions,
  ) {
    super(parseTreeNode, options);

    this.addEventListeners([
      {
        type: 'tw-encrypt-tiddler',
        handler: (_event: IWidgetEvent) => {
          const formDataTiddler = this.wiki.getTiddler(
            `$:/temp/encrypt-form/${this.getVariable('currentTiddler')}`,
          );
          const password = formDataTiddler?.fields.password;
          if (typeof password !== 'string') return true;

          const currentTiddler = this.wiki.getTiddler(
            this.getVariable('currentTiddler'),
          );
          if (currentTiddler === undefined) return true;
          const encrypted = $tw.crypto.encrypt(
            this.wiki.getTiddlerAsJson(this.getVariable('currentTiddler')),
            password,
          );

          const keptFields = Object.fromEntries(
            Object.entries(currentTiddler.fields).filter(([key]) =>
              [
                'title',
                'tags',
                'modified',
                'modifier',
                'created',
                'creator',
                'encrypt-notice',
              ].includes(key)
            ),
          );
          const newFields = {
            text: keptFields['encrypt-notice'],
            encrypted,
            ...keptFields,
          };

          this.wiki.addTiddler(new $tw.Tiddler(newFields));

          return false;
        },
      },
    ]);
  }
}

declare let exports: {
  ['encryption-agent']: typeof EncryptionAgent;
};
exports['encryption-agent'] = EncryptionAgent;
