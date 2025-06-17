import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import {
  type IParseTreeNode,
  type IWidgetEvent,
  type IWidgetInitialiseOptions,
  type Wiki,
} from 'tiddlywiki';

function encryptTiddler(
  wiki: Wiki,
  title: string,
  password: string,
  noticeOverride?: string,
) {
  const tiddler = wiki.getTiddler(title);
  if (tiddler === undefined) return;

  const encrypted = $tw.crypto.encrypt(wiki.getTiddlerAsJson(title), password);

  const keptFields = Object.fromEntries(
    Object.entries(tiddler.fields).filter(([key]) =>
      [
        'title',
        'tags',
        'modified',
        'modifier',
        'created',
        'creator',
        'encrypt-notice',
      ].includes(key),
    ),
  );
  if (noticeOverride) keptFields['encrypt-notice'] = noticeOverride;
  const newFields = {
    text: keptFields['encrypt-notice'],
    encrypted,
    ...keptFields,
  };

  wiki.addTiddler(new $tw.Tiddler(newFields));
}

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
          const currentTitle = this.getVariable('currentTiddler');
          const formDataTiddler = this.wiki.getTiddler(
            `$:/temp/encrypt-form/${currentTitle}`,
          );
          const password = formDataTiddler?.fields.password;
          if (typeof password !== 'string') return true;

          const currentTiddler = this.wiki.getTiddler(currentTitle);
          const group = currentTiddler?.fields.tags?.findLast(tag =>
            tag.startsWith('$:/tags/EncryptGroup/'),
          );

          if (group === undefined) {
            encryptTiddler(this.wiki, currentTitle, password);
          } else {
            const notice = currentTiddler?.fields['encrypt-notice'];
            this.wiki.getTiddlersWithTag(group).forEach(title => {
              encryptTiddler(
                this.wiki,
                title,
                password,
                typeof notice === 'string' ? notice : undefined,
              );
            });
          }

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
