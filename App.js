import React,{useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  PermissionsAndroid,
  Text,
  ActivityIndicator
} from 'react-native';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/database';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const App = () => {
  const [userData, setUserData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    firebase.auth().onAuthStateChanged( user => {
      if (!user) {
        firebase.auth().signInAnonymously();
        const { currentUser } = firebase.auth();
        initialSetup();
        watchPosition();
      }else{
        initialSetup();
        watchPosition();
      }
      setLoader(false);
    });
    
  }, []);

  const initialSetup = () => {
    const { currentUser } = firebase.auth();
      firebase.database().ref(`users/${currentUser.uid}/locations`).
      on('child_added',snapshot => {
        setUserData(arr => [...arr, snapshot.val()]);
        
    });
  }

  const watchPosition = async () => {
      
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,{
          title: 'YourProject App Location Permission',
                message:
                'YourProject App needs access to location.',
        });
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(info => setCurrentLocation(info.coords)
        );
        
        Geolocation.watchPosition(
          (position) => {
            setCurrentLocation(position.coords);
            const { currentUser } = firebase.auth();
            firebase.database().ref(`users/${currentUser.uid}/locations`).
            push({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            alert(error.message);
          },
          {
            enableHighAccuracy: false,
            maximumAge: 1000
          },
        );
      } else {
        alert('Permission Denied');
      }
    } catch (err) {
      alert(err);
    }
};

  return (
    <>
      <View style={styles.container}>
        {!currentLocation.latitude || loader ?
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.title}>Please Confirm that your internet and location turn on.</Text>
        </>
        :
          <MapView
            style={styles.map}
            region={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }}
            //  showsUserLocation={true}
          >
            <MapView.Marker 
                coordinate={currentLocation}
              />
              <Polyline coordinates={userData} />    
          </MapView>
        }
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
  },
  container: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  title:{
    fontSize:14,
    textAlign:'center',
    fontWeight:'bold',
    color:'gray',
    margin:50
  }
});

export default App;
