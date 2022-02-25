import {Button, Confirm, Modal, Image, Header, Segment, SegmentGroup} from 'semantic-ui-react'
import React, { Component } from "react";

export class MyModal extends Component{

    constructor(props){
        super(props);
        this.state={
            open: props.open,
        }
    }

    setOpen(value){
        this.setState({open:value})
    }

    render() {
        return (
            <Modal
                onClose={() => this.setOpen(false)}
                onOpen={() => this.setOpen(true)}
                open={this.state.open}

            >
                <Modal.Header>Select a Photo</Modal.Header>
                <Modal.Content image>
                    <Image size='medium' src='/images/avatar/large/rachel.png' wrapped />
                    <Modal.Description>
                        <Header>Default Profile Image</Header>
                        <p>
                            We've found the following gravatar image associated with your e-mail
                            address.
                        </p>
                        <p>Is it okay to use this photo?</p>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='black' onClick={() => this.setOpen(false)}>
                        Nope
                    </Button>
                    <Button
                        content="Yep, that's me"
                        labelPosition='right'
                        icon='checkmark'
                        onClick={() => this.setOpen(false)}
                        positive
                    />
                </Modal.Actions>
            </Modal>
        )
    }

}