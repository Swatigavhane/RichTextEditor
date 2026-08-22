import type { Block as BlockModel } from '../../model';

type BlockProps = {
    block: BlockModel;
};

export default function Block({ block }: BlockProps) {
    return <div className="editor-block">{block.children.map((run) => run.text).join('')}</div>;
}