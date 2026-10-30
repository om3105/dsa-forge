class Trie {
    private final Trie[] next = new Trie[26];
    private boolean end;

    public Trie() {}

    public void insert(String word) {
        Trie t = this;
        for (char c : word.toCharArray()) {
            if (t.next[c - 'a'] == null) t.next[c - 'a'] = new Trie();
            t = t.next[c - 'a'];
        }
        t.end = true;
    }

    public boolean search(String word) { Trie t = walk(word); return t != null && t.end; }

    public boolean startsWith(String prefix) { return walk(prefix) != null; }

    private Trie walk(String s) {
        Trie t = this;
        for (char c : s.toCharArray()) { t = t.next[c - 'a']; if (t == null) return null; }
        return t;
    }
}
