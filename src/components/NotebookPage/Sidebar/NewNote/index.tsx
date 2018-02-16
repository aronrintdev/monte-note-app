import * as React from 'react';
import ElectronMessager from '../../../../utils/electron-messaging/electronMessager';
import { 
    ADD_NOTE, 
    UPDATE_NOTE_STATE, 
    GET_NOTES, 
    UPDATE_NOTE,
    EDIT_NOTE_ITEM_CONTEXT_MENU, 
    RENAME_NOTE
} from '../../../../constants/index';
import * as $ from 'jquery';
var striptags = require('../../../../utils/striptags');

export interface Props {
    location?: any;
    notebookName: string;
    notes: string[];
    noteContent: string;
    lastOpenedNote: string;
    updateNotes: Function;
    updateLastOpenedNote: Function;
    updateNoteContent: Function;
    noteToRename: any;
    sidebarSize: string;
}

export interface State {
    showInput: string;
    inputValue: string;
    lastOpenedNote: string;
    noteContent: string;
    notes: string[];
}

export class NewNote extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            showInput: 'hidden',
            inputValue: '',
            lastOpenedNote: '',
            noteContent: '',
            notes: []
        };
        ElectronMessager.sendMessageWithIpcRenderer(GET_NOTES, this.props.notebookName);
    }

    showInput() {
        let showInput = this.state.showInput === 'visible' ? 'hidden' : 'visible';
        this.setState({showInput: showInput});

        let noteContentToUpdate = $('.ql-editor').html();

        // Save note data only if there are notes in notebook
        if (this.props.notes.length) {

            let noteDataToSave = prepareNoteData(this.props, noteContentToUpdate);
    
            // Updates note data only if the data got changed
            if (noteDataToSave.noteData !== this.props.noteContent) {
                ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE, noteDataToSave);
            }

        }

        $('li.open-input').hide();
    }

    // Creates notebook on Enter key press
    handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            let note = this.prepareNote(this.state.inputValue as string);
            this.addNote(note);
            this.resetComponentState();
        }
    }

    // Creates notebook when input field loses focus
    handleFocusOut() {
        let note = this.prepareNote(this.state.inputValue as string);
        this.addNote(note);
        this.resetComponentState();

        $('li.open-input').show();
    }

    // After notebook name gets submitted through the input field, resets the
    // component state to default
    resetComponentState() {
        this.setState({
            showInput: 'hidden',
            inputValue: '',
        });
    }

    updateInputValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({inputValue: e.target.value});
    }

    prepareNote(name: string) {
        return name.trim();
    }

    addNote(name: string) {
        if ( (name) && (this.props.notes.indexOf(name) === -1) ) {
            this.setState(
                {lastOpenedNote: name,
                noteContent: '',
                notes: this.props.notes}
            );
            let data = {notebookName: this.props.notebookName, noteName: name};
            ElectronMessager.sendMessageWithIpcRenderer(ADD_NOTE, data);
            ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE_STATE, data);
        }
    }

    // Switches to selected note and loads its content. Saves content of
    // the note we are switching from as well (if needed).
    updateLastOpenedNote(name: string) {
        let noteContentToUpdate = $('.ql-editor').html();

        let noteDataToSave = prepareNoteData(this.props, noteContentToUpdate);

        let noteToSwitchTo = {
            notebookName: this.props.notebookName, 
            noteName: name
        };

        // Updates note data only if the data got changed
        if (noteDataToSave.noteData !== this.props.noteContent) {
            ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE, noteDataToSave);
        }

        // Switch to another note and get that note's content
        ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE_STATE, noteToSwitchTo);
    }

    exitIfEscPressed(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            this.resetComponentState();
            $('li.open-input').show();
        }
    }

    openNoteMenu(note: string) {
        let noteContentToUpdate = $('.ql-editor').html();

        // Updates note data only if the note we right clicked on is one that is
        // currently open and the data of that note got changed
        if ((this.props.lastOpenedNote === note) && (noteContentToUpdate !== this.props.noteContent)) {
            this.props.updateNoteContent(noteContentToUpdate);
            let noteDataToSave = {
                noteName: note,
                notebookName: this.props.notebookName,
                noteData: noteContentToUpdate,
                noteDataTextOnly: striptags(noteContentToUpdate, [], '\n')
            };
            ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE, noteDataToSave);
        }

        let noteData = {
            notebook: this.props.notebookName,
            note: note
        };
        ElectronMessager.sendMessageWithIpcRenderer(EDIT_NOTE_ITEM_CONTEXT_MENU, noteData);
    }

    componentWillUnmount() {
        // When resizing images, on images that have been hovered over, regardless
        // if they have been resized, a css style class for displaying/hiding 
        // a resize frame will be added. In cases when nothing inside a note
        // doesn't change, note will get updated as latest modified inside the
        // db regardless. This check will remove that resize frame style.
        if ($('.ql-editor').find('img').attr('style') === 'border: none; cursor: inherit;') {
            $('.ql-editor').find('img').removeAttr('style');
        }

        let noteContentToUpdate = $('.ql-editor').html();
        let noteData = prepareNoteData(this.props, noteContentToUpdate);
        let noteDataToSave = {...noteData, updatePreviewContent: true};

        // Updates note data only if the data got changed
        if (noteDataToSave.noteData !== this.props.noteContent) {
            ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE, noteDataToSave);
        }
    }

    componentDidMount() {
        $('.sidebar-notebooks-dropdown-sm')
        .add('.sidebar-notebooks-dropdown-md')
        .add('.sidebar-tags-dropdown-sm')
        .add('.sidebar-tags-dropdown')
        .add('.new-notebook-container-sm').on('click', function() {
            if ($(this).hasClass('sidebar-notebooks-dropdown-md')) {
                ($('#collapseNotebooksBigSidebar') as any).collapse('toggle')
            } else if ($(this).hasClass('new-notebook-container-sm')) {
                $('.tag-links-sm').hide();
                $('.sidebar-notebook-links-sm').hide();

                $('.new-notebook-sm').css('display') === 'block' ? 
                $('.new-notebook-sm').hide() :
                $('.new-notebook-sm').show();
                $('input.sidebar-md').focus();
            } else if ($(this).hasClass('sidebar-tags-dropdown-sm')) {
                $('.sidebar-notebook-links-sm').hide();
                $('.new-notebook-sm').hide();

                $('.tag-links-sm').css('display') === 'block' ? 
                $('.tag-links-sm').hide() :
                $('.tag-links-sm').show();
            } else if ($(this).hasClass('sidebar-notebooks-dropdown-sm')) {
                $('.tag-links-sm').hide();
                $('.new-notebook-sm').hide();

                $('.sidebar-notebook-links-sm').css('display') === 'block' ? 
                $('.sidebar-notebook-links-sm').hide() :
                $('.sidebar-notebook-links-sm').show();
            } else if ($(this).hasClass('sidebar-tags-dropdown')) {
                ($('#collapseTagsBigSidebar') as any).collapse('toggle');
            }
        });
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.noteToRename.notebook !== '') {
            if (nextProps.noteToRename !== this.props.noteToRename) {
                if (this.props.noteToRename.notebook !== '') {
                    $(`p[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).show();
                    $(`div[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).hide();
                }
                $(`p[data-entryname="${nextProps.noteToRename.notebook}-${nextProps.noteToRename.note}"]`).hide();
                
                this.setState({inputValue: ''}, () => {
                    let inputDiv = $(`div[data-entryname="${nextProps.noteToRename.notebook}-${nextProps.noteToRename.note}"]`);
                    $(inputDiv).find('input').val('');
                    inputDiv.show();
                    $(inputDiv).find('input').focus();
                });
                
            }
        }
    }

    focusOutFromRenameNoteInput(e: any) {
        this.setState({inputValue: ''}, () => {
            $(`p[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).show();
            $(`div[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).hide();
        });
    }

    renameNoteOrExit(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            let data = {
                notebook: this.props.noteToRename.notebook,
                oldNote: this.props.noteToRename.note,
                newNote: this.state.inputValue,
                renameCurrentlyOpenedNote: false
            };
        
            // If last opened note is note we are about to rename, update its
            // value to new name of the note
            if (this.props.noteToRename.note === this.props.lastOpenedNote) {
                this.props.updateLastOpenedNote(data.newNote);
                data.renameCurrentlyOpenedNote = true;
                ElectronMessager.sendMessageWithIpcRenderer(RENAME_NOTE, data);
            } else {
                ElectronMessager.sendMessageWithIpcRenderer(RENAME_NOTE, data);
            }

        } else if (e.key === 'Escape') {
            this.setState({inputValue: ''}, () => {
                $(`div[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).hide();
                $(`p[data-entryname="${this.props.noteToRename.notebook}-${this.props.noteToRename.note}"]`).show();
            });
        }
    }

    render() {
        let componentToRender;
        if (this.props.sidebarSize === 'lg') {
            componentToRender = (
                <React.Fragment>
                    <ul className="list-group notes">
                        <li
                            className="open-input list-group-item sidebar-note sidebar-link new-notebook-sidebar-link-lg"
                            onClick={() => this.showInput()}
                        >
                            New Note
                            <span className="oi oi-document document-icon home-icon add-notebook notebook-icon-sidebar-lg " />
                        </li>
                    </ul>

                    <div className={`sidebar-app-form input-group input-group-sm ${this.state.showInput}`}>
                        <input
                            value={this.state.inputValue}
                            onChange={e => this.updateInputValue(e)}
                            pattern="^[a-zA-Z0-9]+$"
                            ref={input => input && input.focus()}
                            onKeyPress={(e) => this.handleKeyPress(e)}
                            onKeyDown={(e) => this.exitIfEscPressed(e)}
                            onBlur={() => this.handleFocusOut()}
                            type="text"
                            className="form-control sidebar-lg sidebar-app-form"
                            aria-label="Note"
                            aria-describedby="sizing-addon2"
                        />
                    </div>
                </React.Fragment>
            );
        } else if (this.props.sidebarSize === 'md') {
            componentToRender = (
                <div className={`sidebar-app-form input-group input-group-sm visible`}>
                    <input
                        value={this.state.inputValue}
                        onChange={e => this.updateInputValue(e)}
                        pattern="^[a-zA-Z0-9]+$"
                        ref={input => input && input.focus()}
                        onKeyPress={(e) => this.handleKeyPress(e)}
                        onKeyDown={(e) => this.exitIfEscPressed(e)}
                        onBlur={() => this.handleFocusOut()}
                        type="text"
                        className="form-control add-note sidebar-app-form sidebar-md"
                        aria-label="Note"
                        aria-describedby="sizing-addon2"
                    />
                </div>
            );
        } else if (this.props.sidebarSize === 'sm') {
            componentToRender = (
                <React.Fragment>
                    <li
                        className="nav-item open-input"
                    >
                        <a
                            className="nav-link"
                            href="#"
                            onClick={() => this.showInput()}
                        >
                            New Note
                        </a>
                    </li>

                    <li className="nav-item new-notebook-input-hamburger">
                        <div className={`input-group input-group-sm ${this.state.showInput}`}>
                            <input
                                value={this.state.inputValue}
                                onChange={e => this.updateInputValue(e)}
                                pattern="^[a-zA-Z0-9]+$"
                                ref={input => input && input.focus()}
                                onKeyPress={(e) => this.handleKeyPress(e)}
                                onKeyDown={(e) => this.exitIfEscPressed(e)}
                                onBlur={() => this.handleFocusOut()}
                                type="text"
                                className="form-control new-notebook-hamburger"
                                aria-label="Note"
                                aria-describedby="sizing-addon2"
                            />
                        </div>
                    </li>
                </React.Fragment>
            );
        }
        return (
            componentToRender
        );
    }
}

export default NewNote;

// Helpers

// Creates note data object for sending out to the ipcMain process
function prepareNoteData(props: Props, noteData: string) {
    let noteDataToSave = {
        noteName: props.lastOpenedNote,
        notebookName: props.notebookName,
        noteData: noteData,
        noteDataTextOnly: striptags(noteData, [], '\n')
    };
    return noteDataToSave;
}