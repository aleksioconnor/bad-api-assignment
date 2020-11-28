import Head from 'next/head'
import useSWR from 'swr'
import _ from 'lodash'
import { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import axios from 'axios'
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress'



const selectCategory = (jackets, shirts, accessories, category, ) => {
  if ( category == 'jackets' ) return jackets
  if ( category == 'shirts' ) return shirts
  if ( category == 'accessories' ) return accessories
  else return null
}


const Alphabet = (props) => {
  
  const handeClick = (val) => {
    props.setLetter(val)
  }

  const selected = selectCategory(props.jackets, props.shirts, props.accessories, props.category)

  if(selected) {
    return (
      _.map(Object.keys(selected), (char) => {
        return ( 
          <li className='alpha' key={char} onClick={() => handeClick(char)}><Button variant={char==props.letter ? 'outlined' : 'text'}>{char}</Button> 
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

const FilterCategory = (props) => {
  const handleClick = (val) => {
    props.setCategory(val)
  }
  return (
    <div>
      <Button variant={'jackets' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('jackets')}>jackets</Button>
      <Button variant={'shirts' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('shirts')}>shirts</Button>
      <Button variant={'accessories' == props.category ? 'outlined' : 'text'} onClick={() => handleClick('accessories')}>accessories</Button>
    </div>
  )
}

const ListOfProducts = ({ data, letter, setActiveId, activeId, manufacturers }) => {
  const list = _.map(data[letter].children, (val) => {
    const handleClick = (val) => {
      activeId == val.id ? setActiveId(null) : setActiveId(val.id)
    }
    return (
      <div className={activeId==val.id ? 'list-element-active' : 'list-element'} key={val.id} onClick={ ()=>handleClick(val) }><Button size="small">{val.name}</Button>
      <div className={activeId==val.id ? 'info-active' : 'info'}>
        <ul>
        <li key={val.id + 1}>ID: {val.id}</li>
        <li key={val.id + 2}>Type: {val.type}</li>
        <li key={val.id + 3}>Price: {val.price}$</li>
        <li key={val.id + 4}>Manufacturer: {val.manufacturer}</li>
        <li key={val.id + 5}>Availability: {!(manufacturers[val.manufacturer]) ? 'loading' : manufacturers[val.manufacturer][val.id.toUpperCase()]}</li>
        <li key={val.id + 6}>Colors: {_.map(val.color, color => <span key={val.id + color}>{color} </span>) } </li>
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
    const uniqueManufacturers = _.uniq(_.map(data, 'manufacturer'))
    setPending(uniqueManufacturers)
    dataParser(data, setAccessories)
  }})

// get manufacturers once items are retrieved
useEffect(() => {
  getManufacturers(pending)
}, [pending])

// async function for retrieving availability data in parallel
  const getManufacturers = async (x) => {
    const newObj = {}
    const promises = []
    for (const manufacturer of x) {
      const response = axios(`https://bad-api-assignment.reaktor.com/availability/${manufacturer}`)
      .then(res => res.data)
      .catch()
      promises.push({response, manufacturer})
    }
    Promise.all(promises)
      .then( async () => {
        for (const promise of promises) {
          await promise.response.then(data => {
            if(data.response.length == 2) {
              setError(true) 
              setErrorMessage("Something went wrong with retrieving item availability. Please try refreshing the page.")
            }
            newObj[promise.manufacturer] = dataMap(data.response)
          })
        }
        setManufacturers(newObj)
      })
}

// parse datapayload value
  const parseDatapayload = (string) => {
    if (string) return string.replace(/<\/?[^>]+(>|$)/g, "")
    else return "information not available"
  }

  // maps data into key value pairs
  const dataMap = (data) => {
    const newObj = {}
    _.forEach(data, (val) => {
      newObj[val.id] = parseDatapayload(val.DATAPAYLOAD)
    })
    return newObj
  }
  
  // sorts the items into an array of subarrays sorted alphabetically
  const dataParser = (data, setter) => {
    const sortedData = _.orderBy(data, ['name'], ['asc'])
    const alphabeticalSort = sortedData.reduce((r, e ) => {
      let group = e.name[0]
      if(!r[group]) r[group] = {group, children: [e]}
      else r[group].children.push(e);
      return r;
    }, {})
    setter(alphabeticalSort)
  }

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
      <Backdrop open={!selectCategory(jackets, shirts, accessories, category)}>
        <CircularProgress color="inherit" />
      </Backdrop>
        <div>
          <ul className='alphabet'>
            <Alphabet letter={letter} category={category} jackets={jackets} shirts={shirts} accessories={accessories} setLetter={setLetter} />
          </ul>
          <FilterCategory setCategory={setCategory} category={category}/>
        </div>
      {selectCategory(jackets, shirts, accessories, category) ? <ListOfProducts data={selectCategory(jackets, shirts, accessories, category)} letter={letter} setActiveId={setActiveId} activeId={activeId} manufacturers={manufacturers}/> : null}
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
