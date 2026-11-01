from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState


def test_standard_conversational_turn_cycle():
    transitions = []
    sm = TurnStateMachine("test_sess", on_transition=lambda old, new: transitions.append((old, new)))

    assert sm.state == TurnState.IDLE

    # User starts speaking
    assert sm.transition_to(TurnState.LISTENING) is True
    assert sm.state == TurnState.LISTENING

    # User finishes speaking, server begins LLM inference
    assert sm.transition_to(TurnState.THINKING) is True
    assert sm.state == TurnState.THINKING

    # Audio stream begins playback
    assert sm.transition_to(TurnState.SPEAKING) is True
    assert sm.state == TurnState.SPEAKING

    # Audio playback completes
    assert sm.transition_to(TurnState.IDLE) is True
    assert sm.state == TurnState.IDLE

    assert len(transitions) == 4


def test_barge_in_transition():
    sm = TurnStateMachine("test_sess")
    sm.transition_to(TurnState.LISTENING)
    sm.transition_to(TurnState.THINKING)
    sm.transition_to(TurnState.SPEAKING)

    # User interrupts during avatar speech
    assert sm.transition_to(TurnState.BARGED_IN) is True
    assert sm.state == TurnState.BARGED_IN

    # Resumes listening
    assert sm.transition_to(TurnState.LISTENING) is True
    assert sm.state == TurnState.LISTENING


def test_illegal_transition_rejection():
    sm = TurnStateMachine("test_sess")
    assert sm.state == TurnState.IDLE

    # Cannot jump directly from IDLE to SPEAKING without user input
    assert sm.transition_to(TurnState.SPEAKING) is False
    assert sm.state == TurnState.IDLE
