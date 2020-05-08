var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
var command = ''
let KEY_TIMEOUT = 1000
let blockKeybindings = document.createElement("input")
blockKeybindings.id = "9372rhj28t29e83jdsfvw39rjm19qu"
blockKeybindings.style = "background-color: red;" // display: none; doesn't work
blockKeybindings.onblur = function() { console.log("Blurred") }
document.body.appendChild(blockKeybindings)

function createLinkItem (link, rect, key) {
  var item = document.createElement('span')
  item.setAttribute('style', 'position: absolute; padding: 1px 3px 0px 3px; background-color: yellow; color: black; z-index: 9999; font-family: Helvetica, Arial, sans-serif;font-weight: bold;font-size: 12px; background: linear-gradient(to bottom, #FFF785 0%,#FFC542 100%); border: solid 1px #C38A22; border-radius: 3px; box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.3);')

  item.textContent = key

  item.style.top = (window.scrollY + rect.top) + 'px'
  item.style.left = (window.scrollX + rect.left) + 'px'

  return item
}

function isVisible (rect) {
  return (
    rect.top > 0 &&
    rect.top < window.innerHeight &&
    rect.left > 0 &&
    rect.left < window.innerWidth
  )
}

function getNextKeyCombination (index) {
  // use 1st half of alphabet for single letter, and 2nd half for double letter, so that no collisions can occur
  let halfIndex = Math.floor(alphabet.length / 2)
  if (index < halfIndex) {
    return alphabet[index]
  } else {
    // Subtract half-index from index such that lettering starts at first index for second letter, e.g.
    // na nb nc nd ...
    index -= halfIndex
    // two-letter combination
    return alphabet[Math.floor(index / alphabet.length) + halfIndex] + alphabet[index % alphabet.length]
  }
}

var currentLinkItems = []
var isLinkKeyMode = false
var openLinkNewTab = false
var typedText = ''


// This ensures blockKeybindings don't get blurred because of
// unintentional clicks of the user
document.body.onclick = function(){ if (isLinkKeyMode) {
  blockKeybindings.select()
}}


function showLinkKeys () {
  isLinkKeyMode = true
  typedText = ''

  var links = []
  var linkRects = [];

  [].slice.call(document.querySelectorAll('a, button')).forEach(function (link) {
    var rect = link.getBoundingClientRect()
    if (isVisible(rect)) {
      links.push(link)
      linkRects.push(rect)
    }
  })

  links.forEach(function (link, i) {
    var key = getNextKeyCombination(currentLinkItems.length)
    var item = createLinkItem(link, linkRects[i], key)
    currentLinkItems.push({
      link: link,
      element: item,
      key: key
    })
    document.body.appendChild(item)
  })
}

function hideLinkKeys () {
  isLinkKeyMode = false

  currentLinkItems.forEach(i => i.element.remove())
  currentLinkItems = []
}

function onTextTyped (key) {
  typedText += key

  var viableElementRemaining = false
  currentLinkItems.forEach(function (link) {
    if (link.key === typedText) {
      viableElementRemaining = true
      if (link.link.tagName === 'A') {
        if (openLinkNewTab) {
          window.open(link.link.href)
        } else {
          window.open(link.link.href, '_top')
        }
      } else if (link.link.tagName === 'BUTTON') {
        link.link.click()
      }
      hideLinkKeys()
      // It is critical that we do NOT blur blockKeybindings here
      // else the keypress is passed on to the window
      // This is actually only a problem with opening in a new tab
      // but we can manage it through visibilitychange below
    } else if (!link.key.startsWith(typedText)) {
      link.element.hidden = true
    } else {
      viableElementRemaining = true
    }
  })

  // This is meant to run if the user types a non-valid combination
  if (!viableElementRemaining) {
    hideLinkKeys() // we call this to remove all links, also sets linkKeyMode to false
    blockKeybindings.blur()
  }
}


// document.addEventListener('visibilitychange', function () {
//   if (document.visibilityState != "hidden" && isLinkKeyMode) {
//     blockKeybindings.select()
//   } else if (document.visibilityState != "hidden" && !isLinkKeyMode) {
//     // This is important after a linkKeyMode with opening in new tab
//     // We need to blur it here after returning to this original tab
//     // so that normal keybindings work again
//     blockKeybindings.blur()
//   }
// }, false);

function isCurrentlyInInput () {
  return document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'
}

function copyUrlToClipboard () {
  var dummy = document.createElement('input'),
  text = window.location.href;

  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
}
// (maybe) Future TODO:
// We should provide means to disable the keybings for a blacklist of websites
// github.com for example has a lot of vim-like bindings of its own.


// We use keydown here to match Escape.
// We do not want to prevent default as this will
// prevent copying stuff and likely much more.
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && isLinkKeyMode) {
    hideLinkKeys()
    linkKeyMode = false
    blockKeybindings.blur()
  }
})

// We use keypress here for ease of matching
document.addEventListener('keypress', function (e) {
  if (!isCurrentlyInInput() && !isLinkKeyMode) {
    command += e.key
    var match = true
    switch(command) {
      case 'f':
        showLinkKeys()
        blockKeybindings.select()
        openLinkNewTab = false
        break;
      case 'F':
        showLinkKeys()
        blockKeybindings.select()
        openLinkNewTab = true
        break;
      // Use j to scroll down
      case 'j':
        window.scrollBy(0, 60)
        break;
      // Use k to scroll up
      case 'k':
        window.scrollBy(0, -60)
        break;
      case 'yy':
        copyUrlToClipboard()
        break;
      case 'gg':
        window.scrollTo(0,0)
        break;
      case 'G':
        window.scrollTo(0,document.body.scrollHeight);
        break;
      default:
        match = false
        break;
    }
    if (!match && command.length === 1) {
      // Reset typed command after KEY_TIMEOUT milliseconds
      // This is the time the user has to type the full command
      setTimeout(function () {
        command = ''
      }, KEY_TIMEOUT);
    } else if (match) {
      command = ''
      // We could also add it to a buffer here for repeating the action via '.' as in Vim
    }
    e.preventDefault()
  } else if (isLinkKeyMode) {
    onTextTyped(e.key)
    // e.preventDefault()
  }
})
