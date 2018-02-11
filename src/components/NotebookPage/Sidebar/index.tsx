import * as React from 'react';
import ElectronMessager from '../../../utils/electron-messaging/electronMessager';
// import { ADD_NOTE, UPDATE_NOTE_STATE, GET_NOTES, UPDATE_NOTE, DELETE_NOTE } from '../../../constants/index';
import { ADD_NOTE, UPDATE_NOTE_STATE, GET_NOTES, UPDATE_NOTE } from '../../../constants/index';
import { Link } from 'react-router-dom';
import * as $ from 'jquery';
var striptags = require('../../../utils/striptags');

export interface Props {
    location?: any;
    notebookName: string;
    notes: string[];
    noteContent: string;
    lastOpenedNote: string;
    updateNotes: Function;
    updateLastOpenedNote: Function;
    updateNoteContent: Function;
}

export interface State {
    showInput: string;
    inputValue: string;
    lastOpenedNote: string;
    noteContent: string;
    notes: string[];
}

export class Sidebar extends React.Component<Props, State> {
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

        let editor = document.querySelector('.ql-editor') as Element;
        let noteContentToUpdate = editor.innerHTML;

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
        let editor = document.querySelector('.ql-editor') as Element;
        let noteContentToUpdate = editor.innerHTML;

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

    componentWillUnmount() {
        // When resizing images, on images that have been hovered over, regardless
        // if they have been resized, a css style class for displaying/hiding 
        // a resize frame will be added. In cases when nothing inside a note
        // doesn't change, note will get updated as latest modified inside the
        // db regardless. This check will remove that resize frame style.
        if ($('.ql-editor').find('img').attr('style') === 'border: none; cursor: inherit;') {
            $('.ql-editor').find('img').removeAttr('style');
        }

        let editor = $('.ql-editor')[0];
        let noteContentToUpdate = editor.innerHTML;
        let noteData = prepareNoteData(this.props, noteContentToUpdate);
        let noteDataToSave = {...noteData, updatePreviewContent: true};

        // Updates note data only if the data got changed
        if (noteDataToSave.noteData !== this.props.noteContent) {
            ElectronMessager.sendMessageWithIpcRenderer(UPDATE_NOTE, noteDataToSave);
        }
    }

    render() {
        // let expandNotebooksNoteList = this.props.notes.length > 0 ? 'true' : 'false';
        // let showNotesOrNot = this.props.notes.length > 0 ? 'show' : '';
        return (
            <React.Fragment>
            
                {/* <!-- Sidebar --> */}

                <div className="col-2 sidebar-container col-1-sidebar-container-sm">
                    <div className="sidebar">
                        <div className="sidebar-item sidebar-item-md">
                            <div className="sidebar-item-text-container">
                                <a 
                                    href="" 
                                    className="sidebar-item-text"
                                >Home <span className="sidebar-item-icon oi oi-home"/>
                                </a>
                            </div>
                        </div>

                        <div className="sidebar-item sidebar-item-sm">
                            <div className="sidebar-item-text-container sidebar-item-text-container-sm">
                                <a 
                                    href="" 
                                    className="sidebar-item-text"
                                ><span className="sidebar-item-icon sidebar-item-icon-sm oi oi-home"/>
                                </a>
                            </div>
                        </div>

                        <div className="sidebar-item sidebar-item-md">
                            <div className="sidebar-item-text-container">
                                <ul className="list-group notes">
                                    <li
                                        className="list-group-item open-input sidebar-note sidebar-link"
                                        onClick={() => this.showInput()}
                                    >
                                        New Note
                                        <span className="oi oi-document document-icon home-icon" />
                                    </li>
                                </ul>

                                <div className={`sidebar-app-form input-group input-group-sm ${this.state.showInput}`}>
                                    <input
                                        value={this.state.inputValue}
                                        onChange={e => this.updateInputValue(e)}
                                        pattern="^[a-zA-Z0-9]+$"
                                        ref={input => input && input.focus()}
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        onBlur={() => this.handleFocusOut()}
                                        type="text"
                                        className="form-control add-note sidebar-app-form"
                                        aria-label="Note"
                                        aria-describedby="sizing-addon2"
                                    />
                                </div>
                            </div>
                        </div>
        
                        {/* <!-- Notebooks Dropdown --> */}
                        <div className="sidebar-item sidebar-item-sm">
                            <div className="sidebar-item-text-container sidebar-notebooks-dropdown sidebar-notebooks-dropdown-sm sidebar-item-text-container-sm">
                                <a 
                                    className="sidebar-item-text" 
                                    title="Notebooks" 
                                    href="#collapseNotebooksSmallSidebar" 
                                    data-toggle="collapse" 
                                    aria-expanded="false" 
                                    aria-controls="collapseNotebooksSmallSidebar"
                                >
                                    <span className="sidebar-item-icon sidebar-item-icon-sm oi oi-layers"/>
                                </a>
                            </div>
                        </div>

                        <div className="sidebar-item">

                            <div className="sidebar-item-text-container sidebar-notebooks-dropdown sidebar-notebooks-dropdown-md sidebar-item-text-container-md">
                                <a 
                                    className="sidebar-item-text" 
                                    href="#collapseNotebooksBigSidebar" 
                                    data-toggle="collapse" 
                                    aria-expanded="false" 
                                    aria-controls="collapseNotebooksBigSidebar"
                                >Notebooks
                                <span className="sidebar-item-icon oi oi-chevron-left"/>
                                <span className="sidebar-item-icon oi oi-chevron-bottom"/>
                                </a>
                            </div>
                        </div>
                        {/* <!-- /Notebooks Dropdown --> */}
        
                        {/* <!-- /Tags Dropdown --> */}
                        <div className="sidebar-item sidebar-item-sm">
                            <div className="sidebar-item-text-container sidebar-tags-dropdown-sm sidebar-item-text-container-sm">
                                <a 
                                    className="sidebar-item-text" 
                                    title="Tags" 
                                    href="#collapseTagsSmallSidebar"
                                >
                                    <span className="sidebar-item-icon sidebar-item-icon-sm oi oi-tags"/>
                                </a>
                            </div>
                        </div>
                        <div className="sidebar-item">

                            <div className="sidebar-item-text-container sidebar-item-text-container-md sidebar-tags-dropdown">
                                <a 
                                    className="sidebar-item-text" 
                                    href="#collapseTagsBigSidebar" 
                                    data-toggle="collapse" 
                                    aria-expanded="false"
                                    aria-controls="collapseTagsBigSidebar"
                                >Tags
                                <span className="sidebar-item-icon oi oi-chevron-left"/>
                                <span className="sidebar-item-icon oi oi-chevron-bottom"/>
                                </a>
                            </div>
            
                            <div className="sidebar-collapse-content collapse" id="collapseTagsBigSidebar">
                                <ul className="sidebar-collapsed-content list-unstyled"/>
                            </div>
                        </div>
                        {/* <!-- /Tags Dropdown --> */}

                        {/* <!-- Trash --> */}
                        <div className="sidebar-item sidebar-item-md">
                            <div className="sidebar-item-text-container">
                                    <Link
                                        to={'/trashcan'}
                                        className="sidebar-item-text sidebar-link-lg"
                                        title="Trash"
                                    >
                                        Trash <span className="sidebar-item-icon oi oi-trash"/>
                                    </Link>
                            </div>
                        </div>
        
                        <div className="sidebar-item sidebar-item-sm">
                            <div className="sidebar-item-text-container sidebar-item-text-container-sm">
                                <Link
                                    to={'/trashcan'}
                                    className="sidebar-item-text sidebar-link-md"
                                    title="Trash"
                                >
                                    <span className="sidebar-item-icon sidebar-item-icon-sm oi oi-trash trashcan" />
                                </Link>
                            </div>
                        </div>
                        {/* <!-- /Trash --> */}
        
                    </div>
                </div>

                {/* <!-- Sidebar Extension for Medium & Small Devices --> */}
                <div className="col-2 sidebar-extension-sm sidebar-notebook-links-sm">
                    <div className="sidebar-collapse-content">
                        <ul className="sidebar-collapsed-content list-unstyled"/>
                    </div>
                </div>
                <div className="col-2 sidebar-extension-sm sidebar-links-sm tag-links-sm">
                    <div className="sidebar-collapse-content">
                        <ul className="sidebar-collapsed-content list-unstyled tag-list-sidebar-md"/>
                    </div>
                </div>

                {/* <!-- Add Notebook Extension --> */}
                <div className="col-2 sidebar-extension-sm sidebar-links-sm new-notebook-sm">
                    <div className="sidebar-collapse-content new-notebook-sidebar-md"/>
                </div>
                {/* <!-- /Add Notebook Extension --> */}

                {/* <!-- /Sidebar Extension for Medium & Small Devices --> */}

                {/* <!-- Navbar for Smallest Devices --> */}
                <div className="col-12 navbar-sm-container">
                    <nav className="navbar navbar-expand-lg navbar-light bg-light navbar-fixed-top">
                        <a className="navbar-brand" href="#">Logo</a>
                        <button 
                            className="navbar-toggler" 
                            type="button" 
                            data-toggle="collapse" 
                            data-target="#navbarNavDropdown" 
                            aria-controls="navbarNavDropdown"
                            aria-expanded="false" 
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"/>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNavDropdown">
                            <ul className="navbar-nav">
                                <li className="nav-item active">
                                    <a className="nav-link" href="#">Home
                                        <span className="sr-only">(current)</span>
                                    </a>
                                </li>


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
                                            onBlur={() => this.handleFocusOut()}
                                            type="text"
                                            className="form-control new-notebook-hamburger"
                                            aria-label="Note"
                                            aria-describedby="sizing-addon2"
                                        />
                                    </div>
                                </li>

                                <li className="nav-item dropdown">

                                    <a
                                        title={this.props.notebookName}
                                        className="nav-link dropdown-toggle"
                                        data-toggle="dropdown" 
                                        data-target="#navbarDropdownNotesLink"
                                        href="#"
                                        aria-haspopup="true" 
                                        aria-expanded="false"
                                    >
                                        {
                                            this.props.notebookName
                                        }
                                    </a>
                                    <div className="dropdown-menu" aria-labelledby="navbarDropdownNotesLink">
                                        <ul className="sidebar-collapsed-content list-unstyled">
                                            {(this.props.notes as string[]).map((name: string, index: number) => {
                                                let activeNote =
                                                    name === this.props.lastOpenedNote ? 'currently-opened-note-sidebar-sm' : '';
                                                return (
                                                    <p
                                                        key={name}
                                                        {...(name === this.props.lastOpenedNote ? '' : '') }
                                                        className={`hamburger-menu-tag-element dropdown-item`}
                                                        onClick={() => this.updateLastOpenedNote(name)}
                                                    >
                                                        <span className={activeNote}>
                                                            {name}
                                                        </span> 
                                                    </p>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                </li>
                                <li className="nav-item">
                                    <Link
                                        to={'/trashcan'}
                                        className="hamburger-menu-link"
                                    >
                                        <p
                                            className="nav-link"
                                        >Trash
                                        </p>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>
                {/* <!-- /Navbar for Smallest Devices --> */}
            
            </React.Fragment>

            // <div className="col-2 trashcan sidebar">
            //     <section className="notebooks">
            //         <ul className="list-group notes">
            //             <Link 
            //                 to={'/'} 
            //             >
            //                 <li 
            //                     className="list-group-item sidebar-note sidebar-link"
            //                 >Home <span className="oi oi-home trashcan" />
            //                 </li>
            //             </Link>
            //         </ul>
            //     </section>

            //     <section className="trashcan">
            //         <ul className="list-group notes">
            //             <li
            //                 className="list-group-item open-input sidebar-note sidebar-link"
            //                 onClick={() => this.showInput()}
            //             >
            //                 New Note
            //                 <span className="oi oi-document document-icon home-icon" />
            //             </li>
            //         </ul>

            //         <div className={`sidebar-app-form input-group input-group-sm ${this.state.showInput}`}>
            //             <input
            //                 value={this.state.inputValue}
            //                 onChange={e => this.updateInputValue(e)}
            //                 pattern="^[a-zA-Z0-9]+$"
            //                 ref={input => input && input.focus()}
            //                 onKeyPress={(e) => this.handleKeyPress(e)}
            //                 onBlur={() => this.handleFocusOut()}
            //                 type="text"
            //                 className="form-control add-note sidebar-app-form"
            //                 aria-label="Note"
            //                 aria-describedby="sizing-addon2"
            //             />
            //         </div>
            //     </section>

            //     <section className="trashcan">
            //         <div 
            //             title={this.props.notebookName}
            //             className="notebook-name-sidebar" 
            //             data-toggle="collapse" 
            //             data-target="#collapseExample" 
            //             aria-expanded={expandNotebooksNoteList}
            //         >
            //             {
            //                 this.props.notebookName.length > 25 ? 
            //                 this.props.notebookName.slice(0, 23) + '...' : 
            //                 this.props.notebookName
            //             }
            //             <span className="oi oi-chevron-bottom expand-notebook" />
            //             <span className="oi oi-chevron-left expand-notebook" />
            //         </div>
            //         <div className={`collapse notes-sidebar ${showNotesOrNot}`} id="collapseExample">
            //             <ul className="list-group notes">
            //                 {(this.props.notes as string[]).map((name: string, index: number) => {
            //                     let activeNote = 
            //                     name === this.props.lastOpenedNote ? 'notebook-name-sidebar-active' : '';
            //                     return (
            //                         <li
            //                             key={name}
            //                             {...(name === this.props.lastOpenedNote ? '' : '')}
            //                             className={`list-group-item sidebar-note ${activeNote}`}
            //                             onClick={() => this.updateLastOpenedNote(name)}
            //                         >
            //                             {name}
            //                         </li>
            //                     );
            //                 })}
            //             </ul>

            //         </div>
            //     </section>

            // </div>
        );
    }
}

export default Sidebar;

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