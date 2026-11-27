// Syntax highlighting for the HostAdmin hosts file dialect.
import { StreamLanguage } from '@codemirror/language';
import { isIP } from '../lib/hosts.js';

const ADDRESS = /^[0-9A-Fa-f:.]+(%\S+)?(?=\s|$)/;

function matchIP(stream, consume) {
  const m = stream.match(ADDRESS, false);
  if (!m || !isIP(m[0])) return false;
  if (consume) stream.pos += m[0].length;
  return true;
}

const parser = {
  name: 'hostadmin',

  startState: () => ({ hasIP: false, groupLine: false, groupMarkers: 0, hideBelow: false }),

  token(stream, state) {
    if (stream.sol()) {
      state.hasIP = false;
      state.groupLine = false;
    }
    if (state.hideBelow) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.peek() === '#') {
      if (stream.sol() && stream.match(/^#====(\s|$)/)) {
        state.groupLine = state.groupMarkers++ % 2 === 0 && !stream.eol();
        return 'keyword';
      }

      stream.eatWhile(/[#\s]/);
      if (!state.hasIP && !state.groupLine && matchIP(stream, false)) {
        // A disabled mapping: mark the '#', the address follows as a number.
        return 'keyword';
      }
      if (stream.match(/^hide_all_of_below/i)) {
        state.hideBelow = true;
        return 'keyword';
      }
      if (stream.match(/^hide\s*$/i)) {
        return 'keyword';
      }
      stream.skipToEnd();
      return 'comment';
    }

    if (state.groupLine) {
      // Group name up to an optional "# hide" marker.
      stream.eatWhile(/[^#]/);
      return 'heading';
    }

    if (stream.eatSpace()) return null;

    if (!state.hasIP && matchIP(stream, true)) {
      state.hasIP = true;
      return 'number';
    }

    stream.eatWhile(/[^\s#]/);
    return state.hasIP ? 'variableName' : null;
  },

  languageData: { commentTokens: { line: '#' } },
};

export const hostsLanguage = StreamLanguage.define(parser);
