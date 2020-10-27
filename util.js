export function h ( tag, attrs, ...children )
  {
    let el = document.createElement( tag )

    if( isPlainObject( attrs ) )
      { for( let k in attrs )
        { if( 'function' === typeof attrs[k] )
            { el.addEventListener(k, attrs[k]) }
          else
            { el.setAttribute(k, attrs[k]) }
        }
      }
    else if( attrs )
      { children = [attrs].concat(children) }

    for( let child of children )
      { el.append(child) }

    return el
  }

export function executeJs (container)
  {
    const scripts = container.getElementsByTagName('script')
        , scriptsInitialLength = scripts.length

    for( let i = 0; i < scriptsInitialLength; i++ )
      {
        const script = scripts[i]
            , scriptCopy = document.createElement('script')

        scriptCopy.type = script.type
                        ? script.type
                        : 'text/javascript'

        if( script.innerHTML )
          { scriptCopy.innerHTML = script.innerHTML }
        else if( script.src )
          { scriptCopy.src = script.src }

        scriptCopy.async = false

        script.parentNode
              .replaceChild( scriptCopy, script )
      }
  }

function isPlainObject (v)
  {
    return v
        && 'object' === typeof v
        && Object.prototype === v.__proto__
  }
