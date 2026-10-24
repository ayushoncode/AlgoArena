/**
 * utils/problemSignatures.js — Canonical starter code generator & signature registry
 * Ensures 100% LeetCode parity across JavaScript, Python, Java, and C++.
 */

// Common Type Definitions
const TYPE_INT = { js: 'number', py: 'int', java: 'int', cpp: 'int', retJava: '0', retCpp: '0' }
const TYPE_LONG = { js: 'number', py: 'int', java: 'long', cpp: 'long long', retJava: '0L', retCpp: '0' }
const TYPE_DOUBLE = { js: 'number', py: 'float', java: 'double', cpp: 'double', retJava: '0.0', retCpp: '0.0' }
const TYPE_BOOL = { js: 'boolean', py: 'bool', java: 'boolean', cpp: 'bool', retJava: 'false', retCpp: 'false' }
const TYPE_STRING = { js: 'string', py: 'str', java: 'String', cpp: 'string', retJava: '""', retCpp: '""' }
const TYPE_CHAR = { js: 'string', py: 'str', java: 'char', cpp: 'char', retJava: "' '", retCpp: "' '" }

const TYPE_INT_ARR = { js: 'number[]', py: 'List[int]', java: 'int[]', cpp: 'vector<int>&', retJava: 'new int[]{}', retCpp: '{}' }
const TYPE_INT_LIST_RET = { js: 'number[]', py: 'List[int]', java: 'List<Integer>', cpp: 'vector<int>', retJava: 'new ArrayList<>()', retCpp: '{}' }
const TYPE_INT_ARR_RET = { js: 'number[]', py: 'List[int]', java: 'int[]', cpp: 'vector<int>', retJava: 'new int[]{}', retCpp: '{}' }

const TYPE_INT_MATRIX = { js: 'number[][]', py: 'List[List[int]]', java: 'int[][]', cpp: 'vector<vector<int>>&', retJava: 'new int[][]{}', retCpp: '{}' }
const TYPE_INT_MATRIX_RET = { js: 'number[][]', py: 'List[List[int]]', java: 'List<List<Integer>>', cpp: 'vector<vector<int>>', retJava: 'new ArrayList<>()', retCpp: '{}' }
const TYPE_INT_MATRIX_ARR_RET = { js: 'number[][]', py: 'List[List[int]]', java: 'int[][]', cpp: 'vector<vector<int>>', retJava: 'new int[][]{}', retCpp: '{}' }

const TYPE_STR_ARR = { js: 'string[]', py: 'List[str]', java: 'String[]', cpp: 'vector<string>&', retJava: 'new String[]{}', retCpp: '{}' }
const TYPE_STR_LIST = { js: 'string[]', py: 'List[str]', java: 'List<String>', cpp: 'vector<string>&', retJava: 'new ArrayList<>()', retCpp: '{}' }
const TYPE_STR_LIST_RET = { js: 'string[]', py: 'List[str]', java: 'List<String>', cpp: 'vector<string>', retJava: 'new ArrayList<>()', retCpp: '{}' }

const TYPE_STR_MATRIX_RET = { js: 'string[][]', py: 'List[List[str]]', java: 'List<List<String>>', cpp: 'vector<vector<string>>', retJava: 'new ArrayList<>()', retCpp: '{}' }
const TYPE_CHAR_MATRIX = { js: 'string[][]', py: 'List[List[str]]', java: 'char[][]', cpp: 'vector<vector<char>>&', retJava: 'new char[][]{}', retCpp: '{}' }
const TYPE_CHAR_ARR = { js: 'string[]', py: 'List[str]', java: 'char[]', cpp: 'vector<char>&', retJava: 'new char[]{}', retCpp: '{}' }

const TYPE_TREE = { js: 'TreeNode', py: 'Optional[TreeNode]', java: 'TreeNode', cpp: 'TreeNode*', retJava: 'null', retCpp: 'nullptr', isTree: true }
const TYPE_LIST = { js: 'ListNode', py: 'Optional[ListNode]', java: 'ListNode', cpp: 'ListNode*', retJava: 'null', retCpp: 'nullptr', isList: true }
const TYPE_VOID = { js: 'void', py: 'None', java: 'void', cpp: 'void', retJava: '', retCpp: '' }

// ── Canonical Registry of All Top LeetCode Problems ─────────────────
export const CANONICAL_SIGNATURES = {
  'identify unique signal': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'target value bounds': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_ARR_RET,
  },
  'consolidate time blocks': {
    params: [{ name: 'intervals', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_MATRIX_ARR_RET,
  },
  'information propagation time': {
    params: [{ name: 'edges', ...TYPE_INT_MATRIX }, { name: 'n', ...TYPE_INT }, { name: 'startNode', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'optimal data extraction': {
    params: [{ name: 'packets', ...TYPE_INT_ARR }],
    ret: TYPE_LONG,
  },
  'two sum': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_ARR_RET,
  },
  'largest element in an array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'second largest element in an array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'check if array is sorted and rotated': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_BOOL,
  },
  'left rotate an array by one': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'move zeroes': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'linear search': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'union of two sorted arrays': {
    params: [{ name: 'nums1', ...TYPE_INT_ARR }, { name: 'nums2', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'missing number': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'max consecutive ones': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'longest subarray with given sum k': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'longest subarray with given sum': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'rearrange array elements by sign': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'leaders in an array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'superior elements': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'first missing positive': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'majority element ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'reverse pairs': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'subarray sum equals k': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'largest subarray with 0 sum': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'subarrays with xor k': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'find missing and repeated values': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'count inversions': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'two sum ii - input array is sorted': {
    params: [{ name: 'numbers', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_ARR_RET,
  },
  'add two numbers': {
    params: [{ name: 'l1', ...TYPE_LIST }, { name: 'l2', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'longest substring without repeating characters': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'median of two sorted arrays': {
    params: [{ name: 'nums1', ...TYPE_INT_ARR }, { name: 'nums2', ...TYPE_INT_ARR }],
    ret: TYPE_DOUBLE,
  },
  'longest palindromic substring': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'longest common subsequence': {
    params: [{ name: 'text1', ...TYPE_STRING }, { name: 'text2', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'zigzag conversion': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'numRows', ...TYPE_INT }],
    ret: TYPE_STRING,
  },
  'reverse integer': {
    params: [{ name: 'x', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'string to integer (atoi)': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'palindrome number': {
    params: [{ name: 'x', ...TYPE_INT }],
    ret: TYPE_BOOL,
  },
  'regular expression matching': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'p', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'container with most water': {
    params: [{ name: 'height', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'integer to roman': {
    params: [{ name: 'num', ...TYPE_INT }],
    ret: TYPE_STRING,
  },
  'roman to integer': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'longest common prefix': {
    params: [{ name: 'strs', ...TYPE_STR_ARR }],
    ret: TYPE_STRING,
  },
  '3sum': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_RET,
  },
  '3sum closest': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'letter combinations of a phone number': {
    params: [{ name: 'digits', ...TYPE_STRING }],
    ret: TYPE_STR_LIST_RET,
  },
  '4sum': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'remove nth node from end of list': {
    params: [{ name: 'head', ...TYPE_LIST }, { name: 'n', ...TYPE_INT }],
    ret: TYPE_LIST,
    isList: true,
  },
  'valid parentheses': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'merge two sorted lists': {
    params: [{ name: 'list1', ...TYPE_LIST }, { name: 'list2', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'generate parentheses': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_STR_LIST_RET,
  },
  'merge k sorted lists': {
    params: [{ name: 'lists', js: 'ListNode[]', py: 'List[Optional[ListNode]]', java: 'ListNode[]', cpp: 'vector<ListNode*>&' }],
    ret: TYPE_LIST,
    isList: true,
  },
  'swap nodes in pairs': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'reverse nodes in k-group': {
    params: [{ name: 'head', ...TYPE_LIST }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_LIST,
    isList: true,
  },
  'remove duplicates from sorted array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'remove duplicates from sorted array ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'remove element': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'val', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'find the index of the first occurrence in a string': {
    params: [{ name: 'haystack', ...TYPE_STRING }, { name: 'needle', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'divide two integers': {
    params: [{ name: 'dividend', ...TYPE_INT }, { name: 'divisor', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'substring with concatenation of all words': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'words', ...TYPE_STR_ARR }],
    ret: TYPE_INT_LIST_RET,
  },
  'next permutation': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_VOID,
  },
  'longest valid parentheses': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'search in rotated sorted array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'search in rotated sorted array ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_BOOL,
  },
  'find first and last position of element in sorted array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_ARR_RET,
  },
  'search insert position': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'valid sudoku': {
    params: [{ name: 'board', ...TYPE_CHAR_MATRIX }],
    ret: TYPE_BOOL,
  },
  'sudoku solver': {
    params: [{ name: 'board', ...TYPE_CHAR_MATRIX }],
    ret: TYPE_VOID,
  },
  'combination sum': {
    params: [{ name: 'candidates', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'combination sum ii': {
    params: [{ name: 'candidates', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'trapping rain water': {
    params: [{ name: 'height', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'multiply strings': {
    params: [{ name: 'num1', ...TYPE_STRING }, { name: 'num2', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'wildcard matching': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'p', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'jump game ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'jump game': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_BOOL,
  },
  'permutations': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'permutations ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'rotate image': {
    params: [{ name: 'matrix', ...TYPE_INT_MATRIX }],
    ret: TYPE_VOID,
  },
  'group anagrams': {
    params: [{ name: 'strs', ...TYPE_STR_ARR }],
    ret: TYPE_STR_MATRIX_RET,
  },
  'pow(x, n)': {
    params: [{ name: 'x', ...TYPE_DOUBLE }, { name: 'n', ...TYPE_INT }],
    ret: TYPE_DOUBLE,
  },
  'n-queens': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_STR_MATRIX_RET,
  },
  'n-queens ii': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'maximum subarray': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'spiral matrix': {
    params: [{ name: 'matrix', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_LIST_RET,
  },
  'spiral matrix ii': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_ARR_RET,
  },
  'merge intervals': {
    params: [{ name: 'intervals', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_MATRIX_ARR_RET,
  },
  'insert interval': {
    params: [{ name: 'intervals', ...TYPE_INT_MATRIX }, { name: 'newInterval', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_ARR_RET,
  },
  'length of last word': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'permutation sequence': {
    params: [{ name: 'n', ...TYPE_INT }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_STRING,
  },
  'rotate list': {
    params: [{ name: 'head', ...TYPE_LIST }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_LIST,
    isList: true,
  },
  'unique paths': {
    params: [{ name: 'm', ...TYPE_INT }, { name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'unique paths ii': {
    params: [{ name: 'obstacleGrid', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT,
  },
  'minimum path sum': {
    params: [{ name: 'grid', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT,
  },
  'valid number': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'plus one': {
    params: [{ name: 'digits', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'add binary': {
    params: [{ name: 'a', ...TYPE_STRING }, { name: 'b', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'text justification': {
    params: [{ name: 'words', ...TYPE_STR_ARR }, { name: 'maxWidth', ...TYPE_INT }],
    ret: TYPE_STR_LIST_RET,
  },
  'sqrt(x)': {
    params: [{ name: 'x', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'climbing stairs': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'simplify path': {
    params: [{ name: 'path', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'edit distance': {
    params: [{ name: 'word1', ...TYPE_STRING }, { name: 'word2', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'set matrix zeroes': {
    params: [{ name: 'matrix', ...TYPE_INT_MATRIX }],
    ret: TYPE_VOID,
  },
  'search a 2d matrix': {
    params: [{ name: 'matrix', ...TYPE_INT_MATRIX }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_BOOL,
  },
  'sort colors': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_VOID,
  },
  'minimum window substring': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 't', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'combinations': {
    params: [{ name: 'n', ...TYPE_INT }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'subsets': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'subsets ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'word search': {
    params: [{ name: 'board', ...TYPE_CHAR_MATRIX }, { name: 'word', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'remove duplicates from sorted list': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'remove duplicates from sorted list ii': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'partition list': {
    params: [{ name: 'head', ...TYPE_LIST }, { name: 'x', ...TYPE_INT }],
    ret: TYPE_LIST,
    isList: true,
  },
  'scramble string': {
    params: [{ name: 's1', ...TYPE_STRING }, { name: 's2', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'merge sorted array': {
    params: [
      { name: 'nums1', ...TYPE_INT_ARR },
      { name: 'm', ...TYPE_INT },
      { name: 'nums2', ...TYPE_INT_ARR },
      { name: 'n', ...TYPE_INT },
    ],
    ret: TYPE_VOID,
  },
  'gray code': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT_LIST_RET,
  },
  'decode ways': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'reverse linked list ii': {
    params: [{ name: 'head', ...TYPE_LIST }, { name: 'left', ...TYPE_INT }, { name: 'right', ...TYPE_INT }],
    ret: TYPE_LIST,
    isList: true,
  },
  'restore ip addresses': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_STR_LIST_RET,
  },
  'binary tree inorder traversal': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT_LIST_RET,
    isTree: true,
  },
  'binary tree preorder traversal': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT_LIST_RET,
    isTree: true,
  },
  'binary tree postorder traversal': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT_LIST_RET,
    isTree: true,
  },
  'unique binary search trees': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'interleaving string': {
    params: [{ name: 's1', ...TYPE_STRING }, { name: 's2', ...TYPE_STRING }, { name: 's3', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'validate binary search tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_BOOL,
    isTree: true,
  },
  'recover binary search tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_VOID,
    isTree: true,
  },
  'same tree': {
    params: [{ name: 'p', ...TYPE_TREE }, { name: 'q', ...TYPE_TREE }],
    ret: TYPE_BOOL,
    isTree: true,
  },
  'symmetric tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_BOOL,
    isTree: true,
  },
  'binary tree level order traversal': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT_MATRIX_RET,
    isTree: true,
  },
  'binary tree zigzag level order traversal': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT_MATRIX_RET,
    isTree: true,
  },
  'maximum depth of binary tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT,
    isTree: true,
  },
  'construct binary tree from preorder and inorder traversal': {
    params: [{ name: 'preorder', ...TYPE_INT_ARR }, { name: 'inorder', ...TYPE_INT_ARR }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'construct binary tree from inorder and postorder traversal': {
    params: [{ name: 'inorder', ...TYPE_INT_ARR }, { name: 'postorder', ...TYPE_INT_ARR }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'convert sorted array to binary search tree': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'convert sorted list to binary search tree': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_TREE,
    isTree: true,
    isList: true,
  },
  'balanced binary tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_BOOL,
    isTree: true,
  },
  'minimum depth of binary tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT,
    isTree: true,
  },
  'path sum': {
    params: [{ name: 'root', ...TYPE_TREE }, { name: 'targetSum', ...TYPE_INT }],
    ret: TYPE_BOOL,
    isTree: true,
  },
  'path sum ii': {
    params: [{ name: 'root', ...TYPE_TREE }, { name: 'targetSum', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
    isTree: true,
  },
  'flatten binary tree to linked list': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_VOID,
    isTree: true,
  },
  'distinct subsequences': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 't', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  "pascal's triangle": {
    params: [{ name: 'numRows', ...TYPE_INT }],
    ret: TYPE_INT_MATRIX_RET,
  },
  "pascal's triangle ii": {
    params: [{ name: 'rowIndex', ...TYPE_INT }],
    ret: TYPE_INT_LIST_RET,
  },
  'triangle': {
    params: [{ name: 'triangle', js: 'number[][]', py: 'List[List[int]]', java: 'List<List<Integer>>', cpp: 'vector<vector<int>>&' }],
    ret: TYPE_INT,
  },
  'best time to buy and sell stock': {
    params: [{ name: 'prices', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'best time to buy and sell stock ii': {
    params: [{ name: 'prices', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'best time to buy and sell stock iii': {
    params: [{ name: 'prices', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'best time to buy and sell stock iv': {
    params: [{ name: 'k', ...TYPE_INT }, { name: 'prices', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'binary tree maximum path sum': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT,
    isTree: true,
  },
  'valid palindrome': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'populating next right pointers in each node': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'populating next right pointers in each node ii': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'word ladder': {
    params: [{ name: 'beginWord', ...TYPE_STRING }, { name: 'endWord', ...TYPE_STRING }, { name: 'wordList', ...TYPE_STR_LIST }],
    ret: TYPE_INT,
  },
  'word ladder ii': {
    params: [{ name: 'beginWord', ...TYPE_STRING }, { name: 'endWord', ...TYPE_STRING }, { name: 'wordList', ...TYPE_STR_LIST }],
    ret: TYPE_STR_MATRIX_RET,
  },
  'longest consecutive sequence': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'sum root to leaf numbers': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_INT,
    isTree: true,
  },
  'lowest common ancestor of bst': {
    params: [{ name: 'root', ...TYPE_TREE }, { name: 'p', ...TYPE_TREE }, { name: 'q', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'lowest common ancestor of a binary search tree': {
    params: [{ name: 'root', ...TYPE_TREE }, { name: 'p', ...TYPE_TREE }, { name: 'q', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'lowest common ancestor of a binary tree': {
    params: [{ name: 'root', ...TYPE_TREE }, { name: 'p', ...TYPE_TREE }, { name: 'q', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'serialize and deserialize binary tree': {
    params: [{ name: 'root', ...TYPE_TREE }],
    ret: TYPE_TREE,
    isTree: true,
  },
  'surrounded regions': {
    params: [{ name: 'board', ...TYPE_CHAR_MATRIX }],
    ret: TYPE_VOID,
  },
  'palindrome partitioning': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_STR_MATRIX_RET,
  },
  'palindrome partitioning ii': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'clone graph': {
    params: [{ name: 'node', js: 'Node', py: 'Optional[Node]', java: 'Node', cpp: 'Node*' }],
    ret: { js: 'Node', py: 'Optional[Node]', java: 'Node', cpp: 'Node*', retJava: 'null', retCpp: 'nullptr' },
  },
  'copy list with random pointer': {
    params: [{ name: 'head', js: 'Node', py: 'Optional[Node]', java: 'Node', cpp: 'Node*' }],
    ret: { js: 'Node', py: 'Optional[Node]', java: 'Node', cpp: 'Node*', retJava: 'null', retCpp: 'nullptr' },
  },
  'gas station': {
    params: [{ name: 'gas', ...TYPE_INT_ARR }, { name: 'cost', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'candy': {
    params: [{ name: 'ratings', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'single number': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'single number ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'word break': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'wordDict', ...TYPE_STR_LIST }],
    ret: TYPE_BOOL,
  },
  'word break ii': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 'wordDict', ...TYPE_STR_LIST }],
    ret: TYPE_STR_LIST_RET,
  },
  'linked list cycle': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_BOOL,
    isList: true,
  },
  'linked list cycle detection': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_BOOL,
    isList: true,
  },
  'linked list cycle ii': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'intersection of two linked lists': {
    params: [{ name: 'headA', ...TYPE_LIST }, { name: 'headB', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'reorder list': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_VOID,
    isList: true,
  },
  'insertion sort list': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'sort list': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'lru cache': {
    params: [{ name: 'commands', ...TYPE_STR_LIST }, { name: 'args', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_ARR_RET,
  },
  'evaluate reverse polish notation': {
    params: [{ name: 'tokens', ...TYPE_STR_ARR }],
    ret: TYPE_INT,
  },
  'reverse words in a string': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_STRING,
  },
  'maximum product subarray': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'find minimum in rotated sorted array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'find minimum in rotated sorted array ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'find peak element': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'fraction to recurring decimal': {
    params: [{ name: 'numerator', ...TYPE_INT }, { name: 'denominator', ...TYPE_INT }],
    ret: TYPE_STRING,
  },
  'excel sheet column title': {
    params: [{ name: 'columnNumber', ...TYPE_INT }],
    ret: TYPE_STRING,
  },
  'majority element': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'excel sheet column number': {
    params: [{ name: 'columnTitle', ...TYPE_STRING }],
    ret: TYPE_INT,
  },
  'factorial trailing zeroes': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'maximum gap': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'dungeon game': {
    params: [{ name: 'dungeon', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT,
  },
  'repeated dna sequences': {
    params: [{ name: 's', ...TYPE_STRING }],
    ret: TYPE_STR_LIST_RET,
  },
  'rotate array': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_VOID,
  },
  'reverse bits': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'number of 1 bits': {
    params: [{ name: 'n', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'house robber': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'house robber ii': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'number of islands': {
    params: [{ name: 'grid', ...TYPE_CHAR_MATRIX }],
    ret: TYPE_INT,
  },
  'reverse linked list': {
    params: [{ name: 'head', ...TYPE_LIST }],
    ret: TYPE_LIST,
    isList: true,
  },
  'course schedule': {
    params: [{ name: 'numCourses', ...TYPE_INT }, { name: 'prerequisites', ...TYPE_INT_MATRIX }],
    ret: TYPE_BOOL,
  },
  'course schedule ii': {
    params: [{ name: 'numCourses', ...TYPE_INT }, { name: 'prerequisites', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_ARR_RET,
  },
  'pacific atlantic water flow': {
    params: [{ name: 'heights', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_MATRIX_RET,
  },
  'rotting oranges': {
    params: [{ name: 'grid', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT,
  },
  'daily temperatures': {
    params: [{ name: 'temperatures', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'top k frequent elements': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT_ARR_RET,
  },
  'product of array except self': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'coin change': {
    params: [{ name: 'coins', ...TYPE_INT_ARR }, { name: 'amount', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'longest increasing subsequence': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT,
  },
  'valid anagram': {
    params: [{ name: 's', ...TYPE_STRING }, { name: 't', ...TYPE_STRING }],
    ret: TYPE_BOOL,
  },
  'binary search': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'target', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'custom frequency sort': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }],
    ret: TYPE_INT_ARR_RET,
  },
  'consolidate time blocks': {
    params: [{ name: 'time_blocks', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_MATRIX_ARR_RET,
  },
  'continuous sequence target': {
    params: [{ name: 'nums', ...TYPE_INT_ARR }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_BOOL,
  },
  'network delay tracker': {
    params: [{ name: 'times', ...TYPE_INT_MATRIX }, { name: 'n', ...TYPE_INT }, { name: 'k', ...TYPE_INT }],
    ret: TYPE_INT,
  },
  'valid execution order': {
    params: [{ name: 'numTasks', ...TYPE_INT }, { name: 'prerequisites', ...TYPE_INT_MATRIX }],
    ret: TYPE_BOOL,
  },
  'find redundant connection': {
    params: [{ name: 'edges', ...TYPE_INT_MATRIX }],
    ret: TYPE_INT_ARR_RET,
  },
}

// ── Smart Dynamic Inference Helper ──────────────────────────────────
function splitArgs(str) {
  if (!str) return []
  const list = []
  let depth = 0
  let inQ = false
  let cur = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if ((c === '"' || c === "'") && (i === 0 || str[i - 1] !== '\\')) inQ = !inQ
    if (!inQ) {
      if (c === '[' || c === '{') depth++
      else if (c === ']' || c === '}') depth--
      else if (c === ',' && depth === 0) {
        if (cur.trim()) list.push(cur.trim())
        cur = ''
        continue
      }
    }
    cur += c
  }
  if (cur.trim()) list.push(cur.trim())
  return list
}

function inferReturnType(outputStr, title = '', topic = '') {
  if (!outputStr) return TYPE_INT
  const out = outputStr.trim()
  const lowerTitle = (title || '').toLowerCase()
  const lowerTopic = (topic || '').toLowerCase()
  const isTree = lowerTopic.includes('tree') || lowerTitle.includes('tree') || lowerTitle.includes('bst')
  const isList = lowerTopic.includes('linked') || lowerTitle.includes('linked')

  // Boolean
  if (out === 'true' || out === 'false') return TYPE_BOOL

  // 2D Array
  if (out.startsWith('[[')) {
    if (out.includes('"') || out.includes("'")) {
      return TYPE_STR_MATRIX_RET
    }
    return TYPE_INT_MATRIX_RET
  }

  // 1D Array
  if (out.startsWith('[')) {
    if (out.includes('"') || out.includes("'")) {
      return TYPE_STR_LIST_RET
    }
    if (isTree && (lowerTitle.includes('traversal') || lowerTitle.includes('inorder') || lowerTitle.includes('preorder') || lowerTitle.includes('postorder'))) {
      return TYPE_INT_LIST_RET
    }
    if (isTree && (lowerTitle.includes('invert') || lowerTitle.includes('flatten') || lowerTitle.includes('construct') || lowerTitle.includes('convert'))) {
      return TYPE_TREE
    }
    if (isList && (lowerTitle.includes('reverse') || lowerTitle.includes('merge') || lowerTitle.includes('sort') || lowerTitle.includes('remove') || lowerTitle.includes('rotate'))) {
      return TYPE_LIST
    }
    return TYPE_INT_ARR_RET
  }

  // String (quoted or non-numeric word)
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    return TYPE_STRING
  }
  if (isNaN(Number(out)) && !out.startsWith('[') && !out.startsWith('{')) {
    return TYPE_STRING
  }

  // Float
  if (out.includes('.') && !isNaN(Number(out))) {
    return TYPE_DOUBLE
  }

  return TYPE_INT
}

function inferParamInfo(token, index, total, title = '', topic = '') {
  const t = token.trim()
  const lowerTitle = (title || '').toLowerCase()
  const lowerTopic = (topic || '').toLowerCase()

  const isTree = lowerTopic.includes('tree') || lowerTitle.includes('tree') || lowerTitle.includes('bst') || lowerTitle.includes('ancestor')
  const isList = lowerTopic.includes('linked') || lowerTitle.includes('linked')

  // Lowest Common Ancestor / LCA special case
  if (lowerTitle.includes('ancestor') || lowerTitle.includes('lca')) {
    if (index === 0) return { name: 'root', ...TYPE_TREE }
    if (index === 1) return { name: 'p', ...TYPE_TREE }
    if (index === 2) return { name: 'q', ...TYPE_TREE }
  }

  // Matrix
  if (t.startsWith('[[')) {
    let name = 'grid'
    if (lowerTitle.includes('matrix')) name = 'matrix'
    if (lowerTitle.includes('board') || lowerTitle.includes('sudoku') || lowerTitle.includes('region')) name = 'board'
    if (lowerTitle.includes('interval')) name = 'intervals'

    if (t.includes('"') || t.includes("'")) {
      return { name, ...TYPE_CHAR_MATRIX }
    }
    return { name, ...TYPE_INT_MATRIX }
  }

  // 1D Array
  if (t.startsWith('[')) {
    if (isTree) {
      return { name: total > 1 && index === 1 ? 'q' : (total > 1 && index === 0 ? 'p' : 'root'), ...TYPE_TREE }
    }
    if (isList) {
      return { name: total > 1 ? `list${index + 1}` : 'head', ...TYPE_LIST }
    }
    if (t.includes('"') || t.includes("'")) {
      return { name: (lowerTitle.includes('word') || lowerTitle.includes('dict')) ? 'wordDict' : 'strs', ...TYPE_STR_LIST }
    }
    let name = 'nums'
    if (lowerTitle.includes('price') || lowerTitle.includes('stock')) name = 'prices'
    if (lowerTitle.includes('height') || lowerTitle.includes('water')) name = 'height'
    if (lowerTitle.includes('coin')) name = 'coins'
    if (total > 1) name = `nums${index + 1}`
    return { name, ...TYPE_INT_ARR }
  }

  // String
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")) || (isNaN(Number(t)) && t !== 'true' && t !== 'false')) {
    let name = 's'
    if (total > 1 && index === 1) name = 't'
    if (lowerTitle.includes('word')) name = index === 0 ? 'word1' : (index === 1 ? 'word2' : 'word3')
    return { name, ...TYPE_STRING }
  }

  // Boolean
  if (t === 'true' || t === 'false') {
    return { name: 'flag', ...TYPE_BOOL }
  }

  // Float
  if (t.includes('.') && !isNaN(Number(t))) {
    return { name: index === 0 ? 'x' : 'val', ...TYPE_DOUBLE }
  }

  // Integer
  let name = 'target'
  if (lowerTitle.includes('stair') || lowerTitle.includes('fib') || total === 1) name = 'n'
  else if (lowerTitle.includes('kth') || lowerTitle.includes('rotate') || index === 1) name = 'k'
  else if (total === 2 && index === 0) name = 'n'
  else if (total === 2 && index === 1) name = 'target'
  return { name, ...TYPE_INT }
}

// ── Master Public API: buildStarterTemplate ─────────────────────────
export function buildStarterTemplate(problem, lang = 'javascript') {
  if (!problem) return TEMPLATES[lang] || TEMPLATES.javascript

  const cleanTitle = (problem.title || '').trim().toLowerCase()
  let sig = CANONICAL_SIGNATURES[cleanTitle] || (problem.slug ? CANONICAL_SIGNATURES[problem.slug.replace(/-/g, ' ').toLowerCase()] : null)

  let params = []
  let ret = null
  let isTree = false
  let isList = false

  if (sig) {
    params = sig.params
    ret = sig.ret
    isTree = !!sig.isTree || params.some(p => p.isTree) || (ret && ret.isTree)
    isList = !!sig.isList || params.some(p => p.isList) || (ret && ret.isList)
  } else {
    const rawTokens = splitArgs(problem.sample_input)
    params = rawTokens.map((tok, i) => inferParamInfo(tok, i, rawTokens.length, problem.title, problem.topic))
    ret = inferReturnType(problem.sample_output, problem.title, problem.topic)
    isTree = params.some(p => p.isTree) || (ret && ret.isTree)
    isList = params.some(p => p.isList) || (ret && ret.isList)
  }

  const jsParamNames = params.map(p => p.name).join(', ')
  const jsDocParams = params.map(p => ` * @param {${p.js}} ${p.name}`).join('\n')
  const pyParams = params.map(p => `${p.name}: ${p.py}`).join(', ')
  const javaParams = params.map(p => `${p.java} ${p.name}`).join(', ')
  const cppParams = params.map(p => `${p.cpp} ${p.name}`).join(', ')

  if (lang === 'python' || lang === 'py') {
    let prefix = ''
    if (isTree) {
      prefix += `# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\n`
    } else if (isList) {
      prefix += `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n`
    }
    return `${prefix}class Solution:
    def solution(self${pyParams ? ', ' + pyParams : ''}) -> ${ret.py}:
        # write your solution here
        pass`
  }

  if (lang === 'java') {
    let prefix = 'import java.util.*;\n\n'
    if (isTree) {
      prefix += `/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\n`
    } else if (isList) {
      prefix += `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\n`
    }
    const retStmt = ret.java === 'void' ? '// write your solution here' : `// write your solution here\n        return ${ret.retJava};`
    return `${prefix}class Solution {
    public ${ret.java} solution(${javaParams}) {
        ${retStmt}
    }
}`
  }

  if (lang === 'cpp' || lang === 'c++') {
    let prefix = `#include <iostream>\n#include <vector>\n#include <string>\n#include <queue>\n#include <algorithm>\n#include <unordered_map>\n#include <unordered_set>\nusing namespace std;\n\n`
    if (isTree) {
      prefix += `/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\n`
    } else if (isList) {
      prefix += `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n`
    }
    const retStmt = ret.cpp === 'void' ? '// write your solution here' : `// write your solution here\n        return ${ret.retCpp};`
    return `${prefix}class Solution {
public:
    ${ret.cpp} solution(${cppParams}) {
        ${retStmt}
    }
};`
  }

  // Default javascript
  let prefix = ''
  if (isTree) {
    prefix = `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n`
  } else if (isList) {
    prefix = `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n`
  }
  return `${prefix}/**
${jsDocParams}
 * @return {${ret.js}}
 */
function solution(${jsParamNames}) {
  // write your solution here
  
}`
}

export const TEMPLATES = {
  javascript: `function solution(nums, target) {
  // write your solution here
}`,
  python: `class Solution:
    def solution(self, nums: List[int], target: int) -> List[int]:
        # write your solution here
        pass`,
  java: `class Solution {
    public int[] solution(int[] nums, int target) {
        // write your solution here
        return new int[]{};
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // write your solution here
        return {};
    }
};`,
}
