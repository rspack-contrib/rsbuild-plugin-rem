import './App.css';
import styles from './App.module.css';

const App = () => (
  <div className="container">
    <p className={styles.header} id="header">
      header
    </p>
    <p className={styles.title} id="title">
      title
    </p>
    <p className="description" id="description">
      description
    </p>
  </div>
);

export default App;
