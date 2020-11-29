import Head from 'next/head'
import useSWR from 'swr'
import _ from 'lodash'
import { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import axios from 'axios'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'

/**
 * Returns the data associated with either jackets, shirts or accessories, depending on which filtering is being applied.
 *
 * @param {object} jackets Data of jackets.
 * @param {object} shirts Data of shirts.
 * @param {object} accessories Data of accessories.
 * @param {string} category The filter that is currently being applied.
 * @return {object} returns the data that matches the current filter. If data has yet to initialise, null is returned.
 */
const selectCategory = (jackets, shirts, accessories, category) => {
  if ( category == 'jackets' ) return jackets
  if ( category == 'shirts' ) return shirts
  if ( category == 'accessories' ) return accessories
  else return null
}

/**
 * Renders the alphabetical filtering shown at the top of the page.
 *
 * @component
 */
const Alphabet = (props) => {
  const handeClick = (val) => {
    // This will change the letter stored in state to trigger filtering on the page
    props.setLetter(val)
  }
  // Returns which category is currently selected by the user
  const selected = selectCategory(props.jackets, props.shirts, props.accessories, props.category)
  if(selected) {
    return (
      // Object.keys(selected) will return a list of first letters that will be used in displaying the alphabet
      _.map(Object.keys(selected), (char) => {
        return ( 
          <li className='alpha' key={char} onClick={() => handeClick(char)}>
            <Button variant={char==props.letter ? 'outlined' : 'text'}>
              {char}
            </Button> 
            <style jsx>{`
              .alpha {
                display: inline;
                cursor: pointer;
              }
            `}
            </style>
          </li>
        )
      })
    )
  }
  else return null
}

/**
 * Renders three buttons that control the filtering based on item type i.e., jackets.
 *
 * @component
 */
const FilterCategory = (props) => {
  const handleClick = (val) => {
    // Sets the clicked category to state
    props.setCategory(val)
  }
  return (
    <div>
      <Button variant={'jackets' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('jackets')}>
        jackets
      </Button>
      <Button variant={'shirts' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('shirts')}>
        shirts
      </Button>
      <Button variant={'accessories' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('accessories')}>
        accessories
      </Button>
    </div>
  )
}

/**
 * Renders actual product listing.
 *
 * @component
 */
const ListOfProducts = ({ data, letter, setActiveId, activeId, manufacturers }) => {

  // data[letter].children returns the list of items selected that begin with the letter that is selected
  const list = _.map(data[letter].children, (val) => {
    const handleClick = (val) => {
      activeId == val.id ? setActiveId(null) : setActiveId(val.id)
    }

    return (
      // className is determined based on if this list element is selected, by comparing activeId to val.id
      <div className={ activeId == val.id ? 'list-element-active' : 'list-element' } key={val.id} onClick={ () => handleClick(val) }>
        <Button size="small">
          {val.name}
        </Button>
      {/* the next div is hidden if the element is not selected */}
      <div className={ activeId == val.id ? 'info-active' : 'info' }>
        <ul>
          <li key={val.id + 1}>
            ID: {val.id}
          </li>
          <li key={val.id + 2}>
            Type: {val.type}
          </li>
          <li key={val.id + 3}>
            Price: {val.price}$
          </li>
          <li key={val.id + 4}>
            Manufacturer: {val.manufacturer}
          </li>
          <li key={val.id + 5}>
            {/* if data is yet to be initialised, manufacutrers[val.manufacturer] will return null */}
            Availability: {!(manufacturers[val.manufacturer]) ? 'loading' : manufacturers[val.manufacturer][val.id.toUpperCase()]}
          </li>
          <li key={val.id + 6}>
            Colors: {_.map(val.color, color => <span key={val.id + color}>{color} </span>) } 
          </li>
        </ul>
      </div>
      <style jsx>{`
            .list-element {
              cursor: pointer;
            }
            .list-element-active {
              cursor: pointer;
            }
            .info {
              display: none;
            }
          `}
        </style>
      </div>
    )
  })
  return (
    <ul className="list-container">
      {list}
      <style jsx>{`
            .list-container {
              columns: 5;
            }
          `}
        </style>
    </ul>
  )
}

/**
 * Main component wrapper.
 *
 * @state {string} letter Stores which letter is used to filter products alphabetically
 * @state {object} jackets Stores the jacket data
 * @state {object} shirts Stores the shirt data
 * @state {object} accessories Stores the accessory data
 * @state {string} category Stores which category filtering is being applied
 * @state {string} activeId Stores which list element is currently selected
 * @state {array} pending Stores an array of manufacturer names that have yet to be retrieved from the API
 * @state {object} manufacturers Stores a list with availability information sorted by manufacturer
 * @state {boolean} error Stores boolean which changes to true if an error is detected
 * @state {string} errorMessage Stores error message text
 */
export default function Home() {
  const [ letter, setLetter ] = useState('A')
  const [ jackets, setJackets ] = useState(null)
  const [ shirts, setShirts ] = useState(null)
  const [ accessories, setAccessories ] = useState(null)
  const [ category, setCategory ] = useState('jackets')
  const [ activeId, setActiveId ] = useState(null)
  const [ pending, setPending ] = useState([])
  const [ manufacturers, setManufacturers ] = useState({})
  const [ error, setError ] = useState(false)
  const [ errorMessage, setErrorMessage ] = useState('')

  const fetcher = (...args) => axios(...args).then(res => {
    return res.data
  })
  .catch(err => {
    setError(true)
    setErrorMessage("Something went wrong with retrieving the data. Please try refreshing the page.")
    return null
  })

  useSWR(!jackets ? ['https://bad-api-assignment.reaktor.com/products/jackets'] : null, fetcher, { onSuccess: (data, key, config) => {
    dataParser(data, setJackets)
  }})

  useSWR(!shirts ? 'https://bad-api-assignment.reaktor.com/products/shirts' : null, fetcher, { onSuccess: (data, key, config) => {
    dataParser(data, setShirts)
  }})

  useSWR(!accessories ? 'https://bad-api-assignment.reaktor.com/products/accessories' : null, fetcher, { onSuccess: (data, key, config) => {
    // uniqueManufacturers looks for a list of unique manufacturers and sets that to state to fire getManufacturers()
    const uniqueManufacturers = _.uniq(_.map(data, 'manufacturer'))
    setPending(uniqueManufacturers)
    dataParser(data, setAccessories)
  }})

  // get manufacturers once products are retrieved. useEffect is fired when pending is changed by earlier requests
  useEffect(() => {
    getManufacturers(pending)
  }, [pending])

  /**
   * Asynchronous function that creates as many requests as is needed in parallel to retrieve avaialbility data from api endpoint.
   *
   * @param {array} listOfManufacturers Array containing strings with manufacturer names
   */    
  const getManufacturers = async (listOfManufacturers) => {
    const manufacturerData = {}
    const promises = []
    // create parallel requests by looping through list of manufacturers
    for (const manufacturer of listOfManufacturers) {
      const response = axios(`https://bad-api-assignment.reaktor.com/availability/${manufacturer}`)
        .then(res => res.data)
        .catch(err => {
          setError(true)
          setErrorMessage("Something went wrong with retrieving the data. Please try refreshing the page.")
        })
      promises.push({response, manufacturer})
    }
    // wait for requests to resolve before moving on
    Promise.all(promises)
      .then( async () => {
        for (const promise of promises) {
          await promise.response.then(data => {
            if(data.response.length == 2) {
              setError(true) 
              setErrorMessage("Something went wrong with retrieving item availability. Please try refreshing the page.")
            }
            manufacturerData[promise.manufacturer] = dataMap(data.response)
          })
        }
        // set manufacturer data to state
        setManufacturers(manufacturerData)
      })
}

  /**
   * Removes html tags from strings.
   *
   * @param {string} string String to be handled.
   */  
  const parseDatapayload = (string) => {
    if (string) return string.replace(/<\/?[^>]+(>|$)/g, "")
    else return "information not available"
  }

  /**
   * Maps data into key value pairs
   *
   * @param {object} data Availability data retrieved from API
   */
  const dataMap = (data) => {
    const mappedData = {}
    _.forEach(data, (val) => {
      mappedData[val.id] = parseDatapayload(val.DATAPAYLOAD)
    })
    return mappedData
  }
  
  /**
   * Sorts the data retrieved from the API alphabetically. Example:
   * A: {group: "A", children: Array(190)}
   *
   * @param {object} data Data retrieved from API
   * @param {function} setter setState function that will set the parsed data into current state
   */
    const dataParser = (data, setter) => {
    const sortedData = _.orderBy(data, ['name'], ['asc'])
    const alphabeticalSort = sortedData.reduce((r, e ) => {
      let group = e.name[0]
      if(!r[group]) r[group] = {group, children: [e]}
      else r[group].children.push(e)
      return r
    }, {})
    setter(alphabeticalSort)
  }



  return (
    <div className="container">
      <Head>
        <title>Product listing</title>
      </Head>
      <main>
        <Backdrop open = { !selectCategory(jackets, shirts, accessories, category) }>
          <CircularProgress color="inherit" />
        </Backdrop>
          <div>
            <ul className='alphabet'>
              <Alphabet 
                letter={letter} 
                category={category} 
                jackets={jackets} 
                shirts={shirts} 
                accessories={accessories} 
                setLetter={setLetter} 
              />
            </ul>
            <FilterCategory setCategory={setCategory} category={category} />
          </div>

        {selectCategory(jackets, shirts, accessories, category) ? 
          <ListOfProducts 
            data={selectCategory(jackets, shirts, accessories, category)} 
            letter={letter} 
            setActiveId={setActiveId} 
            activeId={activeId} 
            manufacturers={manufacturers}
          /> 
        : null}

        <Snackbar open={error} autoHideDuration={6000} onClose={() => {}} message={errorMessage}/>

      </main>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
      `}</style>
    </div>
  )
}
