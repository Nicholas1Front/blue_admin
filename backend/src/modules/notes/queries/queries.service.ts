import notesQueriesRepository from './queries.repository.js'
import type { FindNotesByDayDTO } from './queries.schema.js'

class NotesQueriesService {
    async findHome() {
        return notesQueriesRepository.findHome()
    }

    async findByDay(filters: FindNotesByDayDTO) {
        return notesQueriesRepository.findByDay(filters)
    }
}

export default new NotesQueriesService()
