/**
 * frontend/src/content/striverCurriculum.js
 * Canonical Striver A2Z DSA Sheet curriculum with live DB IDs and sample I/O.
 * Used for instant zero-latency client render and offline resilience.
 */

export const DEFAULT_STRIVER_CURRICULUM = [
  {
    id: 'step-3-arrays',
    title: 'Step 3: Solve Problems on Arrays',
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
            difficulty: 'medium',
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
            sample_input: '[2,7,11,15], 9',
            sample_output: '[0,1]'
          },
          {
            id: 'a72830b5-7c9d-4467-ba9b-78bc71556b95',
            title: 'Sort Colors',
            slug: 'sort-colors',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[2,0,2,1,1,0]',
            sample_output: '[0,0,1,1,2,2]'
          },
          {
            id: 'a015fb39-6810-4089-8da0-783206d84dac',
            title: 'Majority Element',
            slug: 'majority-element',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[3,2,3]',
            sample_output: '3'
          },
          {
            id: '2a0660bd-fc07-44b3-81ca-d84a3ef7d24d',
            title: 'Maximum Subarray',
            slug: 'maximum-subarray',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[-2,1,-3,4,-1,2,1,-5,4]',
            sample_output: '6'
          },
          {
            id: '665bb666-36df-410e-9a1c-655fa403cd30',
            title: 'Best Time to Buy and Sell Stock',
            slug: 'best-time-to-buy-and-sell-stock',
            topic: 'arrays',
            difficulty: 'easy',
            sample_input: '[7,1,5,3,6,4]',
            sample_output: '5'
          },
          {
            id: 'fa7393eb-1838-48be-9bfe-3c33281b0ca7',
            title: 'Next Permutation',
            slug: 'next-permutation',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[1,2,3]',
            sample_output: '[1,3,2]'
          },
          {
            id: '1f9914f7-e089-4474-bd11-cae6427a7c71',
            title: 'Longest Consecutive Sequence',
            slug: 'longest-consecutive-sequence',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[100,4,200,1,3,2]',
            sample_output: '4'
          },
          {
            id: 'fc3b7200-61f7-4e38-b144-fe18d2693fd5',
            title: 'Set Matrix Zeroes',
            slug: 'set-matrix-zeroes',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1,1,1],[1,0,1],[1,1,1]]',
            sample_output: '[[1,0,1],[0,0,0],[1,0,1]]'
          },
          {
            id: '495dbc85-eb78-4f92-9546-804db6323b9f',
            title: 'Rotate Image',
            slug: 'rotate-image',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1,2,3],[4,5,6],[7,8,9]]',
            sample_output: '[[7,4,1],[8,5,2],[9,6,3]]'
          },
          {
            id: '84b1f61c-56e7-40ee-ba0d-4999334a1417',
            title: 'Spiral Matrix',
            slug: 'spiral-matrix',
            topic: 'arrays',
            difficulty: 'medium',
            sample_input: '[[1,2,3],[4,5,6],[7,8,9]]',
            sample_output: '[1,2,3,6,9,8,7,4,5]'
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
            sample_output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]'
          },
          {
            id: '4ed46f72-2bc2-4743-a076-37dd8b47846e',
            title: '3Sum',
            slug: '3sum',
            topic: 'two-pointers',
            difficulty: 'medium',
            sample_input: '[-1,0,1,2,-1,-4]',
            sample_output: '[[-1,-1,2],[-1,0,1]]'
          },
          {
            id: '0ac1b804-69d2-40ed-b4ae-d765d434de1b',
            title: '4Sum',
            slug: '4sum',
            topic: 'two-pointers',
            difficulty: 'medium',
            sample_input: '[1,2,3,4,5,-1,-2], 5',
            sample_output: '[[-2,-1,3,5],[-2,1,2,4],[-1,1,2,3]]'
          },
          {
            id: 'dcae2979-4037-45e6-be6c-9fe04c1969fc',
            title: 'First Missing Positive',
            slug: 'first-missing-positive',
            topic: 'arrays',
            difficulty: 'hard',
            sample_input: '[1,2,0]',
            sample_output: '3'
          },
          {
            id: 'a59cd4b8-f79c-4782-b193-f51f86ce91ea',
            title: 'Trapping Rain Water',
            slug: 'trapping-rain-water',
            topic: 'two-pointers',
            difficulty: 'hard',
            sample_input: '[0,1,0,2,1,0,1,3,2,1,2,1]',
            sample_output: '6'
          }
        ]
      }
    ]
  }
]
