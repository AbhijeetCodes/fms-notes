export const EVENT_TYPES = [
  { value: 'assignment', label: 'Assignment', icon: '📝', deadline: true },
  { value: 'exam', label: 'Exam', icon: '📕', deadline: true },
  { value: 'quiz', label: 'Quiz', icon: '❓', deadline: true },
  { value: 'submission', label: 'Submission', icon: '📤', deadline: true },
  { value: 'presentation', label: 'Presentation', icon: '🎤', deadline: true },
  { value: 'class', label: 'Class / Session', icon: '🏫', deadline: false },
  { value: 'other', label: 'Other', icon: '📌', deadline: false },
];

// Types that count as a "deadline" for the homepage widget.
export const DEADLINE_TYPES = EVENT_TYPES.filter(t => t.deadline).map(t => t.value);

export function getEventType(value) {
  return EVENT_TYPES.find(t => t.value === value) || EVENT_TYPES[EVENT_TYPES.length - 1];
}

export function isDeadline(event) {
  return DEADLINE_TYPES.includes(event.event_type);
}
