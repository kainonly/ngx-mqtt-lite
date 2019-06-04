/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function (s) {
    if (!s) return 0;
    const len = s.length;
    let max = 0;
    for (let i = 0; i < len; i++) {
        const container = new Set(s[i]);
        for (let j = i + 1; j < len; j++) {
            const char = s[j];
            if (!container.has(char)) container.add(char);
            else break;
        }
        if (container.size > max) max = container.size;
    }
    return max;
};

console.log(lengthOfLongestSubstring('abcabcbb'));
console.log(lengthOfLongestSubstring('bbbbb'));
console.log(lengthOfLongestSubstring('pwwkew'));
console.log(lengthOfLongestSubstring(''));
console.log(lengthOfLongestSubstring('au'));
console.log(lengthOfLongestSubstring('aab'));
