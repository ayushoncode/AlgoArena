import java.util.*;
import java.nio.file.*;

public class DebugJava {
    public static void main(String[] args) throws Exception {
        String rawTestCases = new String(Files.readAllBytes(Paths.get("private/solutions/batch-4-tests/binary-search.json")), "UTF-8");
        List<Map<String,Object>> tcs = parseJsonArrayOfObjects(rawTestCases);
        System.out.println("Parsed test cases size: " + tcs.size());
    }

    private static List<Map<String,Object>> parseJsonArrayOfObjects(String jsonStr) {
        List<Map<String,Object>> list = new ArrayList<>();
        List<String> objs = splitJsonElements(jsonStr);
        for (String objStr : objs) {
            Map<String,Object> map = new HashMap<>();
            if (objStr.startsWith("{") && objStr.endsWith("}")) objStr = objStr.substring(1, objStr.length()-1);
            List<String> pairs = splitJsonElements(objStr);
            for (String pair : pairs) {
                int col = pair.indexOf(':');
                if (col > 0) {
                    String key = pair.substring(0, col).trim().replace("\"", "");
                    String val = pair.substring(col+1).trim();
                    if (val.startsWith("\"") && val.endsWith("\"")) val = val.substring(1, val.length()-1);
                    if (key.equals("is_hidden")) map.put(key, Boolean.parseBoolean(val));
                    else map.put(key, val);
                }
            }
            list.add(map);
        }
        return list;
    }

    private static List<String> splitJsonElements(String arr) {
        List<String> list = new ArrayList<>();
        if (arr.startsWith("[") && arr.endsWith("]"))
            arr = arr.substring(1, arr.length() - 1).trim();
        if (arr.isEmpty()) return list;
        int depth = 0; boolean inQ = false;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < arr.length(); i++) {
            char c = arr.charAt(i);
            if (c == '"' && (i == 0 || arr.charAt(i-1) != '\\')) inQ = !inQ;
            if (!inQ) {
                if (c=='['||c=='{') depth++;
                else if (c==']'||c=='}') depth--;
                else if (c==',' && depth==0) { list.add(cur.toString().trim()); cur.setLength(0); continue; }
            }
            cur.append(c);
        }
        if (cur.length() > 0) list.add(cur.toString().trim());
        return list;
    }
}
