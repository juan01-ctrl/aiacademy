const terms = [
  "add_conditional_edges",
  "set_entry_point",
  "responses.create",
  "output_text",
  "checkpointer",
  "StateGraph",
  "instructions",
  "temperature",
  "interrupt()",
  "kickoff()",
  "add_node",
  "add_edge",
  "compile",
  "process",
  "Index.add",
].sort((a, b) => b.length - a.length);

function pieces(text: string) {
  const nodes: Array<{ kind: "text" | "term" | "code"; value: string }> = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(...markTerms(text.slice(last, index)));
    const token = match[0];
    if (token.startsWith("**")) nodes.push({ kind: "term", value: token.slice(2, -2) });
    else nodes.push({ kind: "code", value: token.slice(1, -1) });
    last = index + token.length;
  }
  if (last < text.length) nodes.push(...markTerms(text.slice(last)));
  return nodes;
}

function markTerms(text: string) {
  const nodes: Array<{ kind: "text" | "term"; value: string }> = [];
  let index = 0;
  while (index < text.length) {
    let found: { term: string; at: number } | null = null;
    for (const term of terms) {
      const at = text.indexOf(term, index);
      if (at === -1) continue;
      if (!found || at < found.at || (at === found.at && term.length > found.term.length)) {
        found = { term, at };
      }
    }
    if (!found) {
      nodes.push({ kind: "text", value: text.slice(index) });
      break;
    }
    if (found.at > index) nodes.push({ kind: "text", value: text.slice(index, found.at) });
    nodes.push({ kind: "term", value: found.term });
    index = found.at + found.term.length;
  }
  return nodes;
}

export function MarkedText({ text }: { text: string }) {
  return (
    <>
      {pieces(text).map((piece, index) => {
        if (piece.kind === "term") return <mark key={index} className="term">{piece.value}</mark>;
        if (piece.kind === "code") return <code key={index} className="term-code">{piece.value}</code>;
        return <span key={index}>{piece.value}</span>;
      })}
    </>
  );
}
