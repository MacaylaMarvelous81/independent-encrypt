import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import {
  type IParseTreeNode,
  type ITiddlerFields,
  type IWidgetEvent,
  type IWidgetInitialiseOptions,
  Wiki,
} from 'tiddlywiki';

function decryptTiddler(wiki: Wiki, title: string, password: string) {
  const tiddler = wiki.getTiddler(title);
  if (tiddler === undefined) return;

  const encrypted = tiddler.fields.encrypted;
  if (typeof encrypted !== 'string') return;

  const decrypted = $tw.crypto.decrypt(encrypted, password);
  if (decrypted === null) return;

  const fields = {
    ...(JSON.parse(decrypted) as ITiddlerFields),
  };

  wiki.addTiddler(new $tw.Tiddler(fields));
}

class DecryptionAgent extends Widget {
  constructor(
    parseTreeNode: IParseTreeNode,
    options?: IWidgetInitialiseOptions,
  ) {
    super(parseTreeNode, options);

    this.addEventListeners([
      {
        type: 'tw-decrypt-tiddler',
        handler: (_event: IWidgetEvent) => {
          const currentTitle = this.getVariable('currentTiddler');
          const formDataTiddler = this.wiki.getTiddler(
            `$:/temp/decrypt-form/${currentTitle}`,
          );
          const password = formDataTiddler?.fields.password;
          if (typeof password !== 'string') return true;

          const currentTiddler = this.wiki.getTiddler(currentTitle);
          const group = currentTiddler?.fields.tags?.findLast(tag =>
            tag.startsWith('$:/tags/EncryptGroup/'),
          );

          if (group === undefined) {
            decryptTiddler(this.wiki, currentTitle, password);
          } else {
            this.wiki.getTiddlersWithTag(group).forEach(title => {
              decryptTiddler(this.wiki, title, password);
            });
          }

          return false;
        },
      },
    ]);
  }
}

declare let exports: {
  ['decryption-agent']: typeof DecryptionAgent;
};
exports['decryption-agent'] = DecryptionAgent;
