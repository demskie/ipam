package history

import (
	"fmt"
	"log"
	"sort"
	"sync"
	"time"
)

// UserActions is used to contains a list of all changes
type UserActions struct {
	mtx   *sync.RWMutex
	stack []string
}

// NewUserActions returns a new UserActions object
func NewUserActions() *UserActions {
	return &UserActions{
		mtx:   &sync.RWMutex{},
		stack: make([]string, 0),
	}
}

const defaultTimeLayout string = "01-02-2006 15:04:05"

// OverwriteUserHistory reinitializes the UserActions history
func (r *UserActions) OverwriteUserHistory(history []string) {
	r.mtx.Lock()
	r.stack = make([]string, 0, len(history))
	for _, line := range history {
		r.stack = append(r.stack, line)
	}
	r.mtx.Unlock()
}

// RecordUserAction adds the action to history and returns the resulting string
func (r *UserActions) RecordUserAction(user, verb string, changes []string) string {
	t := time.Now().Format(defaultTimeLayout)
	r.mtx.Lock()
	r.stack = append([]string{fmt.Sprintf("%v (%v) is %v: %v", t, user, verb, changes)}, r.stack...)
	r.mtx.Unlock()
	message := fmt.Sprintf("(%v) is %v: %v\n", user, verb, changes)
	log.Print(message)
	return message
}

type sortHistory struct {
	allLines []string
	allTimes []time.Time
}

func (s *sortHistory) Len() int {
	return len(s.allLines)
}

func (s *sortHistory) Swap(i, j int) {
	s.allLines[i], s.allLines[j] = s.allLines[j], s.allLines[i]
	s.allTimes[i], s.allTimes[j] = s.allTimes[j], s.allTimes[i]
}

func (s *sortHistory) Less(i, j int) bool {
	return s.allTimes[i].After(s.allTimes[j])
}

// GetAllUserActions returns a sorted slice all user actions
func (r *UserActions) GetAllUserActions() []string {
	r.mtx.RLock()
	defer r.mtx.RUnlock()
	historySorter := &sortHistory{
		allLines: make([]string, 0, len(r.stack)),
		allTimes: make([]time.Time, 0, len(r.stack)),
	}
	for _, line := range r.stack {
		if len(line) >= 19 {
			t, err := time.Parse(defaultTimeLayout, line[:19])
			if err == nil {
				historySorter.allLines = append(historySorter.allLines, line)
				historySorter.allTimes = append(historySorter.allTimes, t)
			}
		}
	}
	sort.Sort(historySorter)
	return historySorter.allLines
}
