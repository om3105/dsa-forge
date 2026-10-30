import java.util.*;

class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> out = new ArrayList<>();
        go(new StringBuilder(), 0, 0, n, out);
        return out;
    }
    private void go(StringBuilder sb, int open, int close, int n, List<String> out) {
        if (sb.length() == 2 * n) { out.add(sb.toString()); return; }
        if (open < n) { sb.append('('); go(sb, open + 1, close, n, out); sb.deleteCharAt(sb.length() - 1); }
        if (close < open) { sb.append(')'); go(sb, open, close + 1, n, out); sb.deleteCharAt(sb.length() - 1); }
    }
}
