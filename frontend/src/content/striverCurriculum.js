/**
 * frontend/src/content/striverCurriculum.js
 * Striver A2Z DSA Sheet — Step 3: Arrays
 * Synchronized with DB and https://github.com/Codensity30/Strivers-A2Z-DSA-Sheet
 */

export const DEFAULT_STRIVER_CURRICULUM = [
  {
    id: 'step-3-arrays',
    title: 'Arrays',
    topic: 'arrays',
    badge: 'Curriculum Ready',
    subsections: [
      {
        title: 'Easy Problems',
        problems: [
          {
            id: '39da8049-d048-4e48-bfb1-1e3bbabfdec2',
            title: 'Largest Element in an Array',
            slug: 'largest-element-in-an-array',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[2, 5, 1, 3, 0]',
            sample_output: '5'
          },
          {
            id: 'e2ead198-454c-422b-8405-6f2a6622e97d',
            title: 'Second Largest Element in an Array',
            slug: 'second-largest-element-in-an-array',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 2, 4, 7, 7, 5]',
            sample_output: '5'
          },
          {
            id: '0f5180c4-b6df-4b18-80a5-6d6ea7c5d386',
            title: 'Check if Array Is Sorted and Rotated',
            slug: 'check-if-array-is-sorted-and-rotated',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[3, 4, 5, 1, 2]',
            sample_output: 'true'
          },
          {
            id: '0e1c4530-3093-4db8-ab32-374aaf250718',
            title: 'Remove Duplicates from Sorted Array',
            slug: 'remove-duplicates-from-sorted-array',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[-5,-5,-1,0,0,1,1,2]',
            sample_output: '5'
          },
          {
            id: 'b6cdd54c-be02-47f1-8fac-bcac7621a895',
            title: 'Left Rotate an Array by One',
            slug: 'left-rotate-an-array-by-one',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '[2,3,4,5,1]'
          },
          {
            id: '1fbd33e8-6b7d-411b-8bf8-d592a6a4e107',
            title: 'Rotate Array',
            slug: 'rotate-array',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1,2,3,4,5,6,7], 3',
            sample_output: '[5,6,7,1,2,3,4]'
          },
          {
            id: 'b9ca34e4-f6cf-4f62-8c49-aa8ce3c8bbd4',
            title: 'Move Zeroes',
            slug: 'move-zeroes',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[0, 1, 0, 3, 12]',
            sample_output: '[1, 3, 12, 0, 0]'
          },
          {
            id: '4adc3d6a-d019-4029-a7ef-02245802c0d0',
            title: 'Linear Search',
            slug: 'linear-search',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5], 3',
            sample_output: '2'
          },
          {
            id: 'f0a4091a-6464-495c-84b8-ef6263dcc208',
            title: 'Union of Two Sorted Arrays',
            slug: 'union-of-two-sorted-arrays',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5], [1, 2, 3]',
            sample_output: '[1, 2, 3, 4, 5]'
          },
          {
            id: '11cb11d9-c469-4e88-bbb7-a58c01e07d2b',
            title: 'Missing Number',
            slug: 'missing-number',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[3, 0, 1]',
            sample_output: '2'
          },
          {
            id: 'a565ca95-294d-414c-9c40-3ea7ec346311',
            title: 'Max Consecutive Ones',
            slug: 'max-consecutive-ones',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 1, 0, 1, 1, 1]',
            sample_output: '3'
          },
          {
            id: '1a737f9f-b386-4062-82ea-654f071e5f13',
            title: 'Longest Subarray with Given Sum K',
            slug: 'longest-subarray-with-given-sum',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[10, 5, 2, 7, 1, 9], 15',
            sample_output: '4'
          },
          {
            id: '43ee7388-0e00-4e07-85cb-5e4cffb5940c',
            title: 'Single Number',
            slug: 'single-number',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[2, 2, 1]',
            sample_output: '1'
          }
        ]
      },
      {
        title: 'Medium Problems',
        problems: [
          {
            id: '24d10236-4ca2-40ea-81ad-604096b5df02',
            title: 'Two Sum',
            slug: 'two-sum',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[2, 7, 11, 15], 9',
            sample_output: '[0, 1]'
          },
          {
            id: 'a72830b5-7c9d-4467-ba9b-78bc71556b95',
            title: 'Sort Colors',
            slug: 'sort-colors',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[2, 0, 2, 1, 1, 0]',
            sample_output: '[0, 0, 1, 1, 2, 2]'
          },
          {
            id: 'a015fb39-6810-4089-8da0-783206d84dac',
            title: 'Majority Element',
            slug: 'majority-element',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[3, 2, 3]',
            sample_output: '3'
          },
          {
            id: '2a0660bd-fc07-44b3-81ca-d84a3ef7d24d',
            title: 'Maximum Subarray',
            slug: 'maximum-subarray',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]',
            sample_output: '6'
          },
          {
            id: '665bb666-36df-410e-9a1c-655fa403cd30',
            title: 'Best Time to Buy and Sell Stock',
            slug: 'best-time-to-buy-and-sell-stock',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[7, 1, 5, 3, 6, 4]',
            sample_output: '5'
          },
          {
            id: 'c2a9970a-dd21-48b1-9642-1abab320949b',
            title: 'Rearrange Array Elements by Sign',
            slug: 'rearrange-array-elements-by-sign',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[3, 1, -2, -5, 2, -4]',
            sample_output: '[3, -2, 1, -5, 2, -4]'
          },
          {
            id: 'fa7393eb-1838-48be-9bfe-3c33281b0ca7',
            title: 'Next Permutation',
            slug: 'next-permutation',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[1, 2, 3]',
            sample_output: '[1, 3, 2]'
          },
          {
            id: 'ea3f2076-61a7-4e00-9a3f-33d034a75377',
            title: 'Leaders in an Array',
            slug: 'leaders-in-an-array',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[16, 17, 4, 3, 5, 2]',
            sample_output: '[17, 5, 2]'
          },
          {
            id: '1f9914f7-e089-4474-bd11-cae6427a7c71',
            title: 'Longest Consecutive Sequence',
            slug: 'longest-consecutive-sequence',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[100, 4, 200, 1, 3, 2]',
            sample_output: '4'
          },
          {
            id: 'fc3b7200-61f7-4e38-b144-fe18d2693fd5',
            title: 'Set Matrix Zeroes',
            slug: 'set-matrix-zeroes',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1, 1, 1], [1, 0, 1], [1, 1, 1]]',
            sample_output: '[[1, 0, 1], [0, 0, 0], [1, 0, 1]]'
          },
          {
            id: '495dbc85-eb78-4f92-9546-804db6323b9f',
            title: 'Rotate Image',
            slug: 'rotate-image',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
            sample_output: '[[7, 4, 1], [8, 5, 2], [9, 6, 3]]'
          },
          {
            id: '84b1f61c-56e7-40ee-ba0d-4999334a1417',
            title: 'Spiral Matrix',
            slug: 'spiral-matrix',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
            sample_output: '[1, 2, 3, 6, 9, 8, 7, 4, 5]'
          },
          {
            id: '2a4bb842-b85c-4bbd-af7b-5bfabdcbc8f2',
            title: 'Subarray Sum Equals K',
            slug: 'subarray-sum-equals-k',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[1, 1, 1], 2',
            sample_output: '2'
          }
        ]
      },
      {
        title: 'Hard Problems',
        problems: [
          {
            id: 'a0d29184-b979-49a2-bcb6-7bb1bcba1b2f',
            title: "Pascal's Triangle",
            slug: 'pascal-s-triangle',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '5',
            sample_output: '[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]'
          },
          {
            id: '9d1be05d-2812-45a5-b3ab-3b685c38c54d',
            title: 'Majority Element II',
            slug: 'majority-element-ii',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[3, 2, 3]',
            sample_output: '[3]'
          },
          {
            id: '4ed46f72-2bc2-4743-a076-37dd8b47846e',
            title: '3Sum',
            slug: '3sum',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[-1, 0, 1, 2, -1, -4]',
            sample_output: '[[-1, -1, 2], [-1, 0, 1]]'
          },
          {
            id: '0ac1b804-69d2-40ed-b4ae-d765d434de1b',
            title: '4Sum',
            slug: '4sum',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[1, 0, -1, 0, -2, 2], 0',
            sample_output: '[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]'
          },
          {
            id: 'dc34e587-aebc-4a40-8cbb-3419f64ea966',
            title: 'Merge Intervals',
            slug: 'merge-intervals',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1, 3], [2, 6], [8, 10], [15, 18]]',
            sample_output: '[[1, 6], [8, 10], [15, 18]]'
          },
          {
            id: 'dcae2979-4037-45e6-be6c-9fe04c1969fc',
            title: 'First Missing Positive',
            slug: 'first-missing-positive',
            topic: 'arrays',
            difficulty: 'hard',
            sample_input: '[1, 2, 0]',
            sample_output: '3'
          },
          {
            id: 'a59cd4b8-f79c-4782-b193-f51f86ce91ea',
            title: 'Trapping Rain Water',
            slug: 'trapping-rain-water',
            topic: 'arrays',
            difficulty: 'hard',
            sample_input: '[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
            sample_output: '6'
          },
          {
            id: '1c40ef0a-81d6-45ba-9393-000db6648622',
            title: 'Reverse Pairs',
            slug: 'reverse-pairs',
            topic: 'arrays',
            difficulty: 'hard',
            sample_input: '[1, 3, 2, 3, 1]',
            sample_output: '2'
          },
          {
            id: '5b998fd4-ca86-4845-8e65-a0d43799da26',
            title: 'Maximum Product Subarray',
            slug: 'maximum-product-subarray',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[2, 3, -2, 4]',
            sample_output: '6'
          },
          {
            id: 'a05b0cb8-f86e-4a2c-af0a-93a46b1fa32c',
            title: 'Largest Subarray with 0 Sum',
            slug: 'largest-subarray-with-0-sum',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[15, -2, 2, -8, 1, 7, 10, 23]',
            sample_output: '5'
          },
          {
            id: '6fe9cdcd-f5db-45bb-9b2d-045d0fd748c4',
            title: 'Subarrays with XOR K',
            slug: 'subarrays-with-xor-k',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[4, 2, 2, 6, 4], 6',
            sample_output: '4'
          },
          {
            id: '0310e807-616a-483b-8646-d3a87dd671ce',
            title: 'Merge Sorted Array',
            slug: 'merge-sorted-array',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3',
            sample_output: '[1, 2, 2, 3, 5, 6]'
          },
          {
            id: 'dff3c5ef-67dd-43f7-8ef5-6150957a65ab',
            title: 'Find Missing and Repeated Values',
            slug: 'find-missing-and-repeated-values',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[1, 3, 3]',
            sample_output: '[3, 2]'
          },
          {
            id: 'c49ee719-115f-4ce3-b26e-b4716b591dd1',
            title: 'Count Inversions',
            slug: 'count-inversions',
            topic: 'arrays',
            difficulty: 'hard',
            sample_input: '[2, 4, 1, 3, 5]',
            sample_output: '3'
          }
        ]
      }
    ]
  },
  {
    id: 'step-4-binary-search',
    title: 'Binary Search',
    topic: 'binary-search',
    badge: 'Curriculum Ready',
    subsections: [
      {
        title: 'BS on 1D Arrays',
        problems: [
          {
            id: 'a19913b1-1af9-4c9e-aae6-ae8e4c1fc770',
            title: 'Binary Search',
            slug: 'binary-search',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[-1, 0, 3, 5, 9, 12], 9',
            sample_output: '4'
          },
          {
            id: '06229979-8987-47b1-a4c0-af068dbde14c',
            title: 'Implement Lower Bound',
            slug: 'lower-bound',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[1, 2, 8, 10, 11, 12, 19], 5',
            sample_output: '2'
          },
          {
            id: '45bba363-3ccb-4832-a57c-868212c71c03',
            title: 'Implement Upper Bound',
            slug: 'upper-bound',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[2, 3, 6, 7, 8, 8, 11, 11, 12], 6',
            sample_output: '3'
          },
          {
            id: '123e47ae-3e1d-4395-9a8b-fef0920d83cf',
            title: 'Search Insert Position',
            slug: 'search-insert-position',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[1, 3, 5, 6], 5',
            sample_output: '2'
          },
          {
            id: '12ca331e-bccf-48e1-a2da-d9357c752daf',
            title: 'Floor and Ceil in Sorted Array',
            slug: 'floor-and-ceil-in-sorted-array',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[3, 4, 7, 8, 8, 10], 5',
            sample_output: '[4, 7]'
          },
          {
            id: 'a7d2695f-6502-4c10-8a39-606903340f5e',
            title: 'Find First and Last Position of Element in Sorted Array',
            slug: 'find-first-and-last-position-of-element-in-sorted-array',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[5, 7, 7, 8, 8, 10], 8',
            sample_output: '[3,4]'
          },
          {
            id: '7f152ae3-eda3-4666-be5f-65bc72124189',
            title: 'Count Occurrences in Sorted Array',
            slug: 'count-occurrences-in-sorted-array',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[1, 1, 2, 2, 2, 2, 3], 2',
            sample_output: '4'
          },
          {
            id: '60dc6df5-ced4-4be8-a120-28fa46df89d4',
            title: 'Search in Rotated Sorted Array',
            slug: 'search-in-rotated-sorted-array',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[4,5,6,7,0,1,2], 0',
            sample_output: '4'
          },
          {
            id: '8872422f-69e8-4a93-a85d-ba95ed219233',
            title: 'Search in Rotated Sorted Array II',
            slug: 'search-in-rotated-sorted-array-ii',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[2,5,6,0,0,1,2], 0',
            sample_output: 'true'
          },
          {
            id: '77dc09df-8c95-40cc-b38b-a8dc86f94565',
            title: 'Find Minimum in Rotated Sorted Array',
            slug: 'find-minimum-in-rotated-sorted-array',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[3,4,5,1,2]',
            sample_output: '1'
          },
          {
            id: '80ac3e07-bac9-4b80-beed-1382be5c8649',
            title: 'Find Minimum in Rotated Sorted Array II',
            slug: 'find-minimum-in-rotated-sorted-array-ii',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[2,2,2,0,1]',
            sample_output: '0'
          },
          {
            id: '9c15151f-b62d-4a29-92c8-ad45e6e1f794',
            title: 'Find Kth Rotation',
            slug: 'find-kth-rotation',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[4, 5, 6, 7, 0, 1, 2, 3]',
            sample_output: '4'
          },
          {
            id: 'a2934792-41de-4a8b-b700-402072a24010',
            title: 'Single Element in a Sorted Array',
            slug: 'single-element-in-a-sorted-array',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,1,2,3,3,4,4,8,8]',
            sample_output: '2'
          },
          {
            id: '201dc0e2-7f11-4513-bc0d-9d121c107197',
            title: 'Find Peak Element',
            slug: 'find-peak-element',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,2,3,1]',
            sample_output: '2'
          }
        ]
      },
      {
        title: 'Find Answers by BS in Search Space',
        problems: [
          {
            id: '660ee0ea-222a-436f-8012-09bbbb969966',
            title: 'Sqrt(x)',
            slug: 'sqrt-x',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '4',
            sample_output: '2'
          },
          {
            id: 'd345026e-4500-4453-beb2-32a22deea6be',
            title: 'Find Nth Root of M',
            slug: 'nth-root-of-an-integer',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '3, 27',
            sample_output: '3'
          },
          {
            id: '8d26041b-a1ad-427d-9c05-108d849f9f37',
            title: 'Koko Eating Bananas',
            slug: 'koko-eating-bananas',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[3,6,7,11], 8',
            sample_output: '4'
          },
          {
            id: '07744848-d500-407c-8daa-78c180417340',
            title: 'Minimum Number of Days to Make m Bouquets',
            slug: 'minimum-number-of-days-to-make-m-bouquets',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,10,3,10,2], 3, 1',
            sample_output: '3'
          },
          {
            id: 'e243be8a-b62b-4fdd-a7ee-8e670d58767d',
            title: 'Find the Smallest Divisor Given a Threshold',
            slug: 'find-the-smallest-divisor-given-a-threshold',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,2,5,9], 6',
            sample_output: '5'
          },
          {
            id: '0b885224-8eb4-4cb3-a114-f68be342f2d7',
            title: 'Capacity To Ship Packages Within D Days',
            slug: 'capacity-to-ship-packages-within-d-days',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,2,3,4,5,6,7,8,9,10], 5',
            sample_output: '15'
          },
          {
            id: '8d0c432b-19bb-483b-afed-b304c9fae554',
            title: 'Kth Missing Positive Number',
            slug: 'kth-missing-positive-number',
            topic: 'binary-search',
            difficulty: 'easy',
            sample_input: '[2,3,4,7,11], 5',
            sample_output: '9'
          },
          {
            id: '4c481cea-cc17-406b-9532-29ee18b5daec',
            title: 'Aggressive Cows',
            slug: 'aggressive-cows',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[0, 3, 4, 7, 10, 9], 4',
            sample_output: '3'
          },
          {
            id: 'e8637d4a-92c6-437a-80de-46585bc4957f',
            title: 'Book Allocation Problem',
            slug: 'book-allocation-problem',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[12, 34, 67, 90], 2',
            sample_output: '113'
          },
          {
            id: 'c95cf200-32d0-4197-8a99-727ff5d44669',
            title: 'Split Array Largest Sum',
            slug: 'split-array-largest-sum',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[7,2,5,10,8], 2',
            sample_output: '18'
          },
          {
            id: '2b0222fc-29f0-44b7-a671-b51c50880de2',
            title: "Painter's Partition Problem",
            slug: 'painter-s-partition-problem',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[10, 20, 30, 40], 2',
            sample_output: '60'
          },
          {
            id: 'a93c4c21-135a-4361-b485-f892892412f5',
            title: 'Kth Element of Two Sorted Arrays',
            slug: 'kth-element-of-two-sorted-arrays',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[2, 3, 6, 7, 9], [1, 4, 8, 10], 5',
            sample_output: '6'
          },
          {
            id: 'e0db31ab-ee7f-4d32-84df-ac2e93fbbb86',
            title: 'Median of Two Sorted Arrays',
            slug: 'median-of-two-sorted-arrays',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[1, 3], [2]',
            sample_output: '2'
          }
        ]
      },
      {
        title: 'Find Peak / BS on 2D Arrays',
        problems: [
          {
            id: '8d2059d9-2787-4163-b734-d320828da7ab',
            title: 'Row with Maximum 1s',
            slug: 'row-with-max-1s',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[[0, 1, 1, 1], [0, 0, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0]]',
            sample_output: '2'
          },
          {
            id: '9b6d6247-8e8a-46aa-9c8b-fadd6f71fb85',
            title: 'Search a 2D Matrix',
            slug: 'search-a-2d-matrix',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3',
            sample_output: 'true'
          },
          {
            id: '4632f27b-5f77-457f-bd7b-db3619017caf',
            title: 'Search a 2D Matrix II',
            slug: 'search-a-2d-matrix-ii',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], 5',
            sample_output: 'true'
          },
          {
            id: 'fe29ae72-90b3-4024-837c-1aa42e27151d',
            title: 'Find a Peak Element II',
            slug: 'find-a-peak-element-ii',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[[1, 4], [3, 2]]',
            sample_output: '[1, 0]'
          },
          {
            id: '8de7ee5f-2e4a-469d-ae9b-837450355caa',
            title: 'Matrix Median',
            slug: 'matrix-median',
            topic: 'binary-search',
            difficulty: 'hard',
            sample_input: '[[1, 3, 5], [2, 6, 9], [3, 6, 9]]',
            sample_output: '5'
          }
        ]
      },
      {
        title: 'Advanced Binary Search & Interval Space',
        problems: [
          {
            id: '924f483e-7888-4ef5-86b3-569746bc2eb9',
            title: 'H-Index II',
            slug: 'h-index-ii',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[0,1,3,5,6]',
            sample_output: '3'
          },
          {
            id: '4e6e1275-e39e-4c06-a28c-28429f88517c',
            title: 'Heaters',
            slug: 'heaters',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[1,2,3], [2]',
            sample_output: '1'
          },
          {
            id: 'a7057d13-b518-4bbc-863c-685069bf4a97',
            title: 'Find Right Interval',
            slug: 'find-right-interval',
            topic: 'binary-search',
            difficulty: 'medium',
            sample_input: '[[3,4],[2,3],[1,2]]',
            sample_output: '[-1,0,1]'
          }
        ]
      }
    ]
  },
  {
    id: 'step-5-strings',
    title: 'Strings',
    topic: 'strings',
    badge: 'Curriculum Ready',
    subsections: [
      {
        title: 'Basic and Easy String Problems',
        problems: [
          {
            id: '1bde0271-eba8-4e65-9a19-0d87702478a2',
            title: 'Remove Outermost Parentheses',
            slug: 'remove-outermost-parentheses',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"(()())(())"',
            sample_output: '"()()()"'
          },
          {
            id: 'a39b3100-0381-4109-a06d-5273cf7b8dbe',
            title: 'Reverse Words in a String',
            slug: 'reverse-words-in-a-string',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"the sky is blue"',
            sample_output: '"blue is sky the"'
          },
          {
            id: '13572739-c969-40d2-9029-8abb9ee863d3',
            title: 'Largest Odd Number in String',
            slug: 'largest-odd-number-in-string',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"52"',
            sample_output: '"5"'
          },
          {
            id: 'b4716156-4d04-4127-bfb6-62b7d625795e',
            title: 'Longest Common Prefix',
            slug: 'longest-common-prefix',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '["flower","flow","flight"]',
            sample_output: '"fl"'
          },
          {
            id: 'a492153c-7921-45f9-8157-b8091b599a9b',
            title: 'Isomorphic Strings',
            slug: 'isomorphic-strings',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"egg", "add"',
            sample_output: 'true'
          },
          {
            id: 'a8da426b-cd1f-4d91-b96e-9b04a081738a',
            title: 'Rotate String',
            slug: 'rotate-string',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"abcde", "cdeab"',
            sample_output: 'true'
          },
          {
            id: '53356cd1-454d-44d4-91f2-d0df4223bb9b',
            title: 'Valid Anagram',
            slug: 'valid-anagram',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"anagram", "nagaram"',
            sample_output: 'true'
          }
        ]
      },
      {
        title: 'Medium String Problems',
        problems: [
          {
            id: 'd8c00f1b-ec14-4abc-8828-a5d6a359ee81',
            title: 'Sort Characters By Frequency',
            slug: 'sort-characters-by-frequency',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"tree"',
            sample_output: '"eert"'
          },
          {
            id: '7ed8b71c-6511-40f5-9b7e-4739a165e1fb',
            title: 'Maximum Nesting Depth of the Parentheses',
            slug: 'maximum-nesting-depth-of-the-parentheses',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"(1+(2*3)+((8)/4))+1"',
            sample_output: '3'
          },
          {
            id: 'd37c4560-471e-45ff-88b5-2e2ceea9bb4e',
            title: 'Roman to Integer',
            slug: 'roman-to-integer',
            topic: 'strings',
            difficulty: 'easy',
            sample_input: '"III"',
            sample_output: '3'
          },
          {
            id: '33ddd563-d1f3-45e9-a3f4-7f55bddcd941',
            title: 'String to Integer (atoi)',
            slug: 'string-to-integer-atoi',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"42"',
            sample_output: '42'
          },
          {
            id: '1bca12df-4c49-4486-b4de-fc1de9bd029e',
            title: 'Count Number of Substrings',
            slug: 'count-number-of-substrings',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"aba", 2',
            sample_output: '3'
          },
          {
            id: '8e345781-1280-4cab-aa6e-88dee6366205',
            title: 'Longest Palindromic Substring',
            slug: 'longest-palindromic-substring',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"babad"',
            sample_output: '"bab"'
          },
          {
            id: 'cccc018f-1857-4dd0-8ca0-42a94496e097',
            title: 'Sum of Beauty of All Substrings',
            slug: 'sum-of-beauty-of-all-substrings',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"aabcb"',
            sample_output: '5'
          },
          {
            id: '1e00c2e7-6893-4488-b783-fa57b1e0c25e',
            title: 'Find the Index of the First Occurrence in a String',
            slug: 'find-the-index-of-the-first-occurrence-in-a-string',
            topic: 'strings',
            difficulty: 'medium',
            sample_input: '"sadbutsad", "sad"',
            sample_output: '0'
          }
        ]
      }
    ]
  },
  {
    id: 'step-6-learn-linkedlist',
    title: 'Learn LinkedList',
    topic: 'linked-list',
    badge: 'Curriculum Ready',
    subsections: [
      {
        title: 'Learn 1D LinkedList',
        problems: [
          {
            id: '7f9530eb-ce06-4beb-8bcd-132549816702',
            title: 'Introduction to Linked List',
            slug: 'introduction-to-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '[1, 2, 3, 4, 5]'
          },
          {
            id: '72d133e2-4c7d-4abc-8ea7-4400391d3321',
            title: 'Insert Node at the End of Linked List',
            slug: 'insert-node-at-the-end-of-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5], 6',
            sample_output: '[1, 2, 3, 4, 5, 6]'
          },
          {
            id: '575d7c09-9a5e-4f33-a2e1-297683bbe06e',
            title: 'Delete Node in a Linked List',
            slug: 'delete-node-in-a-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[4, 5, 1, 9], 5',
            sample_output: '[4, 1, 9]'
          },
          {
            id: 'e2ba666f-9fd8-41bc-b265-efbd6374a395',
            title: 'Count Nodes of Linked List',
            slug: 'count-nodes-of-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '5'
          },
          {
            id: '1a6c4dfe-8e73-40fa-9ca9-0418e1256dd8',
            title: 'Search in a Linked List',
            slug: 'search-in-a-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4], 3',
            sample_output: 'true'
          }
        ]
      },
      {
        title: 'Learn Doubly LinkedList',
        problems: [
          {
            id: 'c87d292b-a825-4e7d-98ae-79aa0f5ed9ab',
            title: 'Introduction to Doubly Linked List',
            slug: 'introduction-to-doubly-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '[1, 2, 3, 4, 5]'
          },
          {
            id: '5cca4f36-5d4e-4f92-95bd-9c1ed356a752',
            title: 'Insert a Node in Doubly Linked List',
            slug: 'insert-a-node-in-doubly-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[2, 4, 5], 2, 6',
            sample_output: '[2, 4, 5, 6]'
          },
          {
            id: '55748ff9-772a-417e-8e16-b18e48191008',
            title: 'Delete Node in Doubly Linked List',
            slug: 'delete-node-in-doubly-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 3, 4], 3',
            sample_output: '[1, 3]'
          },
          {
            id: '829021b5-fb89-4706-9837-72313acfa3be',
            title: 'Reverse a Doubly Linked List',
            slug: 'reverse-a-doubly-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[3, 4, 5]',
            sample_output: '[5, 4, 3]'
          }
        ]
      },
      {
        title: 'Medium Problems of LL',
        problems: [
          {
            id: '35e61f94-74e6-4b95-86f6-1a115756a663',
            title: 'Middle of the Linked List',
            slug: 'middle-of-the-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '[3, 4, 5]'
          },
          {
            id: '097263ca-0d40-4b65-8eb8-8fe756606b26',
            title: 'Reverse Linked List',
            slug: 'reverse-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 3, 4, 5]',
            sample_output: '[5, 4, 3, 2, 1]'
          },
          {
            id: 'ca82cadb-6cd7-4ddc-b4bc-fe81fb07a2dc',
            title: 'Linked List Cycle',
            slug: 'linked-list-cycle',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[3, 2, 0, -4], 1',
            sample_output: 'true'
          },
          {
            id: '26814fcd-c825-47e4-8d65-9b30a6665d42',
            title: 'Linked List Cycle II',
            slug: 'linked-list-cycle-ii',
            topic: 'linked-list',
            difficulty: 'medium',
            sample_input: '[3, 2, 0, -4], 1',
            sample_output: 'tail connects to node index 1'
          },
          {
            id: 'f8b0bab9-2e1c-4f7d-a025-300cc3446470',
            title: 'Find Length of Loop',
            slug: 'find-length-of-loop',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[25, 14, 19, 33, 10, 21, 39, 90, 58, 45], 4',
            sample_output: '6'
          },
          {
            id: '1adb5d3c-189e-4448-8b5f-1eb6233a54eb',
            title: 'Palindrome Linked List',
            slug: 'palindrome-linked-list',
            topic: 'linked-list',
            difficulty: 'easy',
            sample_input: '[1, 2, 2, 1]',
            sample_output: 'true'
          }
        ]
      }
    ]
  }
]

